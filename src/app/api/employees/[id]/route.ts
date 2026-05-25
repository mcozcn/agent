import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchEmployeeSchema = z.object({
  firstName:  z.string().min(1).max(100).optional(),
  lastName:   z.string().min(1).max(100).optional(),
  email:      z.string().email().optional(),
  phone:      z.string().max(50).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  title:      z.string().max(100).optional().nullable(),
  companyId:  z.string().cuid().optional(),
  isActive:   z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Oturum açılmamış" }, { status: 401 });
    }
    const role = session.user.role as string;
    if (role !== "ADMIN" && role !== "IT_STAFF") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { id } = await params;

    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 }); }

    const parsed = patchEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri", details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Çalışan bulunamadı" }, { status: 404 });
    }

    const newEmail = parsed.data.email ?? existing.email;
    const newCompanyId = parsed.data.companyId ?? existing.companyId;
    if (newEmail !== existing.email || newCompanyId !== existing.companyId) {
      const conflict = await prisma.employee.findUnique({
        where: { email_companyId: { email: newEmail, companyId: newCompanyId } },
      });
      if (conflict && conflict.id !== id) {
        return NextResponse.json({ error: "Bu firmada aynı e-posta ile kayıtlı çalışan var" }, { status: 409 });
      }
    }

    const employee = await prisma.employee.update({ where: { id }, data: parsed.data });
    return NextResponse.json(employee);
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError?.code === "P2002") {
      return NextResponse.json({ error: "Bu firmada aynı e-posta ile kayıtlı çalışan var" }, { status: 409 });
    }
    console.error("[employees PATCH]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Oturum açılmamış" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.employee.findUnique({
      where: { id },
      include: { _count: { select: { assignments: { where: { isActive: true } } } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Çalışan bulunamadı" }, { status: 404 });
    }

    if (existing._count.assignments > 0) {
      return NextResponse.json({
        error: "Aktif zimmeti olan çalışan pasife alınamaz. Önce zimmetleri iade edin.",
      }, { status: 409 });
    }

    const employee = await prisma.employee.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json(employee);
  } catch (error) {
    console.error("[employees DELETE]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
