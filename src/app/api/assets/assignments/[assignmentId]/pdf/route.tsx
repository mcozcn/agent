import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import * as ReactPDF from "@react-pdf/renderer";
import { ZimmetTutanagi } from "@/lib/pdf-templates/zimmet-tutanagi";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
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

    const { assignmentId } = await params;

    const idSchema = z.string().cuid();
    const parsed = idSchema.safeParse(assignmentId);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    const assignment = await prisma.assetAssignment.findUnique({
      where: { id: assignmentId },
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
        employee: {
          select: {
            firstName: true,
            lastName: true,
            title: true,
            department: true,
            company: {
              select: { name: true, address: true, phone: true },
            },
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Zimmet kaydı bulunamadı" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const pdfData = {
      company: assignment.employee.company,
      employee: {
        firstName: assignment.employee.firstName,
        lastName: assignment.employee.lastName,
        title: assignment.employee.title,
        department: assignment.employee.department,
      },
      assignments: [
        {
          assetCode: assignment.asset.assetCode,
          name: assignment.asset.name,
          category: assignment.asset.category as string,
          brand: assignment.asset.brand,
          model: assignment.asset.model,
          serialNumber: assignment.asset.serialNumber,
          assignedAt: assignment.assignedAt.toISOString(),
          notes: assignment.notes,
        },
      ],
      generatedAt: now,
    };

    const buffer = await ReactPDF.renderToBuffer(
      <ZimmetTutanagi data={pdfData} /> as React.ReactElement<ReactPDF.DocumentProps>
    );

    const safeCode = assignment.asset.assetCode.replace(/[^a-zA-Z0-9À-ɏ]/g, "_");
    const date = new Date().toLocaleDateString("tr-TR").replace(/\./g, "-");
    const filename = `zimmet-${safeCode}-${date}.pdf`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[assignment pdf GET]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
