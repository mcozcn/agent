import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import * as ReactPDF from "@react-pdf/renderer";
import { ZimmetTutanagi } from "@/lib/pdf-templates/zimmet-tutanagi";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(
  _req: Request,
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

    const idSchema = z.string().cuid();
    const parsed = idSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        company: { select: { name: true, address: true, phone: true } },
        assignments: {
          where: { isActive: true },
          orderBy: { assignedAt: "asc" },
          include: {
            asset: {
              select: {
                assetCode: true,
                name: true,
                category: true,
                brand: true,
                model: true,
                serialNumber: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Personel bulunamadı" }, { status: 404 });
    }

    if (employee.assignments.length === 0) {
      return NextResponse.json({ error: "Aktif zimmet bulunamadı" }, { status: 404 });
    }

    const now = new Date().toISOString();

    const pdfData = {
      company: employee.company,
      employee: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        title: employee.title,
        department: employee.department,
      },
      assignments: employee.assignments.map((a) => ({
        assetCode: a.asset.assetCode,
        name: a.asset.name,
        category: a.asset.category as string,
        brand: a.asset.brand,
        model: a.asset.model,
        serialNumber: a.asset.serialNumber,
        assignedAt: a.assignedAt.toISOString(),
        notes: a.notes,
      })),
      generatedAt: now,
    };

    const buffer = await ReactPDF.renderToBuffer(
      <ZimmetTutanagi data={pdfData} /> as React.ReactElement<ReactPDF.DocumentProps>
    );

    const safeName = employee.lastName.replace(/[^a-zA-Z0-9À-ɏ]/g, "_");
    const date = new Date().toLocaleDateString("tr-TR").replace(/\./g, "-");
    const filename = `zimmet-${safeName}-${date}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[employee assignments pdf GET]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
