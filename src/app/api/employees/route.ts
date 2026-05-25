import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const employeeSchema = z.object({
  firstName:  z.string().min(1).max(100),
  lastName:   z.string().min(1).max(100),
  email:      z.string().email(),
  phone:      z.string().max(50).optional(),
  department: z.string().max(100).optional(),
  title:      z.string().max(100).optional(),
  companyId:  z.string().cuid(),
  isActive:   z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Oturum açılmamış" }, { status: 401 });
    }
    const role = session.user.role as string;
    if (role !== "ADMIN" && role !== "IT_STAFF") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const isActiveParam = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    if (isActiveParam === "true") where.isActive = true;
    if (isActiveParam === "false") where.isActive = false;

    const employees = await prisma.employee.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        company: { select: { shortCode: true, name: true } },
        _count: { select: { assignments: { where: { isActive: true } } } },
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("[employees GET]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Oturum açılmamış" }, { status: 401 });
    }
    const role = session.user.role as string;
    if (role !== "ADMIN" && role !== "IT_STAFF") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    let body: unknown;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 }); }

    const parsed = employeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veri", details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.employee.findUnique({
      where: { email_companyId: { email: parsed.data.email, companyId: parsed.data.companyId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Bu firmada aynı e-posta ile kayıtlı çalışan var" }, { status: 409 });
    }

    let employee;
    try {
      employee = await prisma.employee.create({ data: parsed.data });
    } catch (createError) {
      const prismaError = createError as { code?: string };
      if (prismaError?.code === "P2002") {
        return NextResponse.json({ error: "Bu firmada aynı e-posta ile kayıtlı çalışan var" }, { status: 409 });
      }
      throw createError;
    }
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("[employees POST]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
