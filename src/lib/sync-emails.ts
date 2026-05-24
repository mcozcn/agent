import { prisma } from "@/lib/db";
import { fetchEmailsForSync } from "@/lib/email-sync";
import { parseEmailToTicket } from "@/lib/email-parser";
import { calculateSlaDeadline } from "@/lib/sla";
import { generateTicketNumber } from "@/lib/utils";
import { notifyTicketCreated } from "@/lib/email-notifier";

export interface SyncEmailsResult {
  count: number;
  skipped: number;
  message: string;
}

function isAllowedSender(senderEmail: string, allowedSenders: string): boolean {
  const entries = allowedSenders
    .split(/[\n,]/)
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  return entries.some(entry => {
    if (entry.startsWith("@")) {
      // Domain match: @firma.com matches anyone@firma.com
      return senderEmail.endsWith(entry);
    }
    return senderEmail === entry;
  });
}

export async function syncEmails(triggeredByUserId?: string): Promise<SyncEmailsResult> {
  const emailConfig = await prisma.emailConfig.findFirst();
  if (!emailConfig?.isActive) {
    return { count: 0, skipped: 0, message: "E-posta entegrasyonu aktif değil." };
  }

  let actorId = triggeredByUserId;
  if (!actorId) {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) throw new Error("Sistem yöneticisi bulunamadı.");
    actorId = admin.id;
  }

  const { emails, markAsRead } = await fetchEmailsForSync(emailConfig);

  let createdCount = 0;
  let skippedCount = 0;

  const monitoredMailbox = (emailConfig.imapUser || emailConfig.mailbox || "").toLowerCase();
  const allowedSenders = emailConfig.allowedSenders || "";

  // Load active company domains once (avoid N+1 query per message)
  const activeCompanies = await prisma.company.findMany({
    where: { isActive: true },
    select: { id: true, emailDomains: true },
  });
  const domainToCompanyId = new Map<string, string>();
  for (const c of activeCompanies) {
    for (const domain of c.emailDomains) {
      domainToCompanyId.set(domain.toLowerCase(), c.id);
    }
  }

  for (const email of emails) {
    const alreadyExists = await prisma.ticket.findFirst({
      where: { emailMessageId: email.id },
    });
    if (alreadyExists) continue;

    const senderEmail = email.from.emailAddress.address.toLowerCase();
    const subject = email.subject || "";
    const senderDomain = "@" + (senderEmail.split("@")[1] ?? "").toLowerCase();
    const matchedCompanyId = domainToCompanyId.get(senderDomain) ?? null;

    // 1. Skip emails from the monitored mailbox itself — prevents notification loop
    if (monitoredMailbox && senderEmail === monitoredMailbox) {
      await markAsRead(email.id);
      skippedCount++;
      continue;
    }

    // 2. Skip system-generated subjects — TKT confirmations, auto-replies, bounces
    if (
      /^\[TKT-/i.test(subject) ||
      /^(auto-reply|otomatik yanıt|out of office|delivery status|mailer-daemon|undeliverable)/i.test(subject)
    ) {
      await markAsRead(email.id);
      skippedCount++;
      continue;
    }

    // 3. Gate: sender must be in the allowed list, a registered user, OR from a known company domain
    const registeredUser = await prisma.user.findUnique({ where: { email: senderEmail } });
    const inAllowedList = isAllowedSender(senderEmail, allowedSenders);
    const isFromKnownCompany = matchedCompanyId !== null;

    if (!isFromKnownCompany && !registeredUser && !inAllowedList) {
      await markAsRead(email.id);
      skippedCount++;
      continue;
    }

    // 4. AI extracts title / priority / category
    const parsedTicket = await parseEmailToTicket(
      subject,
      email.body?.content || email.bodyPreview || "",
      email.from.emailAddress.name || senderEmail,
    );

    let requester = registeredUser;
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
        companyId: matchedCompanyId,
      },
    });

    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        userId: actorId,
        action: "E-postadan otomatik oluşturuldu",
        newStatus: "OPEN",
      },
    });

    await markAsRead(email.id);
    await notifyTicketCreated(
      { id: ticket.id, ticketNumber, title: ticket.title },
      senderEmail,
      requester.name || senderEmail,
    );
    createdCount++;
  }

  await prisma.emailConfig.updateMany({
    where: { id: emailConfig.id },
    data: { lastSyncAt: new Date() },
  });

  return {
    count: createdCount,
    skipped: skippedCount,
    message: `${createdCount} yeni talep oluşturuldu${skippedCount > 0 ? `, ${skippedCount} mail atlandı` : ""}.`,
  };
}
