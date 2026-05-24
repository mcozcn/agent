import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "IT_STAFF", "REQUESTER"]).optional(),
  department: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  companyId: z.string().cuid().optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const parsed = patchUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri", details: parsed.error.issues }, { status: 400 });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    if (parsed.data.isActive === false && session.user.id === id) {
      return NextResponse.json({ error: "Kendi hesabınızı devre dışı bırakamazsınız." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: { id: true, name: true, email: true, role: true, department: true, phone: true, isActive: true, createdAt: true, permissions: true, companyId: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[users/[id]/PATCH] Error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (session.user.id === id) {
    return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz." }, { status: 400 });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // If user has requested tickets, reassign them to the first admin
    const ticketCount = await prisma.ticket.count({ where: { requesterId: id } });
    if (ticketCount > 0) {
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN", id: { not: id } },
        select: { id: true },
      });
      if (admin) {
        await prisma.ticket.updateMany({ where: { requesterId: id }, data: { requesterId: admin.id } });
      }
    }

    // Clean up other references
    await prisma.ticket.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } });
    await prisma.ticketActivity.deleteMany({ where: { userId: id } });
    await prisma.ticketComment.deleteMany({ where: { authorId: id } });
    await prisma.assetAssignment.deleteMany({ where: { userId: id } });
    await prisma.sLABreach.deleteMany({ where: { assignedToId: id } });

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[users/[id]/DELETE] Error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
