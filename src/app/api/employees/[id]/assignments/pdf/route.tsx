import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import * as ReactPDF from "@react-pdf/renderer";
import { ZimmetTutanagi } from "@/lib/pdf-templates/zimmet-tutanagi";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Oturum açılmamış" }), { status: 401 });
    }
    const role = session.user.role as string;
    if (role !== "ADMIN" && role !== "IT_STAFF") {
      return new Response(JSON.stringify({ error: "Yetkisiz erişim" }), { status: 403 });
    }

    const { id } = await params;

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
      return new Response(JSON.stringify({ error: "Personel bulunamadı" }), { status: 404 });
    }

    if (employee.assignments.length === 0) {
      return new Response(JSON.stringify({ error: "Aktif zimmet bulunamadı" }), { status: 404 });
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

    const date = new Date().toLocaleDateString("tr-TR").replace(/\./g, "-");
    const filename = `zimmet-${employee.lastName}-${date}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[employee assignments pdf GET]", error);
    return new Response(JSON.stringify({ error: "Sunucu hatası" }), { status: 500 });
  }
}
