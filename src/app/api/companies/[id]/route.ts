import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const patchCompanySchema = z.object({
  name:         z.string().min(2).max(100).optional(),
  shortCode:    z.string().min(1).max(10).transform(v => v.toUpperCase()).optional(),
  emailDomains: z.array(z.string().regex(/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)).max(100).optional(),
  address:      z.string().max(500).optional().nullable(),
  phone:        z.string().max(50).optional().nullable(),
  website:      z.string().max(200).optional().nullable(),
  isActive:     z.boolean().optional(),
  contactName:  z.string().max(100).optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal("")),
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
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { id } = await params;

    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 }); }

    const parsed = patchCompanySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri", details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });
    }

    if (parsed.data.shortCode && parsed.data.shortCode !== existing.shortCode) {
      const conflict = await prisma.company.findUnique({ where: { shortCode: parsed.data.shortCode } });
      if (conflict) {
        return NextResponse.json({ error: "Bu kısa kod zaten kullanılıyor" }, { status: 409 });
      }
    }

    const company = await prisma.company.update({ where: { id }, data: parsed.data });
    return NextResponse.json(company);
  } catch (error) {
    const prismaError = error as { code?: string };
    if (prismaError?.code === "P2002") {
      return NextResponse.json({ error: "Bu kısa kod zaten kullanılıyor" }, { status: 409 });
    }
    console.error("[companies PATCH]", error);
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

    const existing = await prisma.company.findUnique({
      where: { id },
      include: { _count: { select: { users: true, tickets: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Firma bulunamadı" }, { status: 404 });
    }

    await prisma.user.updateMany({ where: { companyId: id }, data: { companyId: null } });
    await prisma.ticket.updateMany({ where: { companyId: id }, data: { companyId: null } });
    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[companies DELETE]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
