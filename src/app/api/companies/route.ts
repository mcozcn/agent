import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const companySchema = z.object({
  name:         z.string().min(2).max(100),
  shortCode:    z.string().min(1).max(10).transform(v => v.toUpperCase()),
  emailDomains: z.array(z.string().regex(/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Domain @domain.com formatında olmalı")).max(100).default([]),
  address:      z.string().max(500).optional(),
  phone:        z.string().max(50).optional(),
  website:      z.string().max(200).optional(),
  isActive:     z.boolean().default(true),
  contactName:  z.string().max(100).optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Oturum açılmamış" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { users: true, tickets: true } },
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("[companies GET]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Oturum açılmamış" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 }); }

    const parsed = companySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri", details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.company.findUnique({ where: { shortCode: parsed.data.shortCode } });
    if (existing) {
      return NextResponse.json({ error: "Bu kısa kod zaten kullanılıyor" }, { status: 409 });
    }

    let company;
    try {
      company = await prisma.company.create({ data: parsed.data });
    } catch (createError) {
      const prismaError = createError as { code?: string };
      if (prismaError?.code === "P2002") {
        return NextResponse.json({ error: "Bu kısa kod zaten kullanılıyor" }, { status: 409 });
      }
      throw createError;
    }
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("[companies POST]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
