import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { fetchEmailsForSync } from "@/lib/email-sync";
import { parseEmailToTicket } from "@/lib/email-parser";
import { calculateSlaDeadline } from "@/lib/sla";
import { generateTicketNumber } from "@/lib/utils";

export async function POST() {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "IT_STAFF")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emailConfig = await prisma.emailConfig.findFirst();
  if (!emailConfig?.isActive) {
    return NextResponse.json({ message: "E-posta entegrasyonu aktif değil." }, { status: 400 });
  }

  try {
    const { emails, markAsRead } = await fetchEmailsForSync(emailConfig);

    let createdCount = 0;

    for (const email of emails) {
      const alreadyExists = await prisma.ticket.findFirst({
        where: { emailMessageId: email.id },
      });
      if (alreadyExists) continue;

      const senderEmail = email.from.emailAddress.address;
      let requester = await prisma.user.findUnique({ where: { email: senderEmail } });

      if (!requester) {
        const bcrypt = await import("bcryptjs");
        const tempPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
        requester = await prisma.user.create({
          data: {
            email: senderEmail,
            name: email.from.emailAddress.name || senderEmail,
            password: tempPassword,
            role: "REQUESTER",
          },
        });
      }

      const parsedTicket = await parseEmailToTicket(
        email.subject || "Konu Yok",
        email.body?.content || email.bodyPreview || "",
        email.from.emailAddress.name || senderEmail,
      );

      const count = await prisma.ticket.count();
      const ticketNumber = generateTicketNumber(count);
      const slaDeadline = await calculateSlaDeadline(parsedTicket.priority);

      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber,
          title: parsedTicket.title,
          description: parsedTicket.description,
          priority: parsedTicket.priority,
          category: parsedTicket.category,
          requesterId: requester.id,
          slaDeadline,
          emailMessageId: email.id,
          emailFrom: senderEmail,
        },
      });

      await prisma.ticketActivity.create({
        data: {
          ticketId: ticket.id,
          userId: session.user.id,
          action: "E-postadan otomatik oluşturuldu",
          newStatus: "OPEN",
        },
      });

      await markAsRead(email.id);
      createdCount++;
    }

    await prisma.emailConfig.updateMany({
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      message: `${createdCount} yeni talep oluşturuldu.`,
      count: createdCount,
    });
  } catch (error) {
    console.error("Email sync error:", error);
    return NextResponse.json(
      { error: "Senkronizasyon hatası: " + (error instanceof Error ? error.message : "Bilinmeyen hata") },
      { status: 500 },
    );
  }
}
