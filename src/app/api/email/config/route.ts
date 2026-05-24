import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const emailConfigSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("IMAP"),
    isActive: z.boolean(),
    imapHost: z.string().min(1, "Host gerekli"),
    imapPort: z.number().int().min(1).max(65535),
    imapUser: z.string().email("Geçerli e-posta adresi girin"),
    imapPassword: z.string().min(1, "Şifre gerekli"),
    tenantId: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    mailbox: z.string().optional(),
  }),
  z.object({
    provider: z.literal("MICROSOFT_GRAPH"),
    isActive: z.boolean(),
    tenantId: z.string().min(1, "Tenant ID gerekli"),
    clientId: z.string().min(1, "Client ID gerekli"),
    clientSecret: z.string().min(1, "Client Secret gerekli"),
    mailbox: z.string().email("Geçerli posta kutusu adresi girin"),
    imapHost: z.string().optional(),
    imapPort: z.number().optional(),
    imapUser: z.string().optional(),
    imapPassword: z.string().optional(),
  }),
]);

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await prisma.emailConfig.findFirst();
  return NextResponse.json(
    config ?? {
      isActive: false,
      provider: "IMAP",
      tenantId: "",
      clientId: "",
      clientSecret: "",
      mailbox: "",
      imapHost: "",
      imapPort: 993,
      imapUser: "",
      imapPassword: "",
      lastSyncAt: null,
    },
  );
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await req.json();
  const parsed = emailConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const data = parsed.data;
  const existing = await prisma.emailConfig.findFirst();

  const config = existing
    ? await prisma.emailConfig.update({ where: { id: existing.id }, data })
    : await prisma.emailConfig.create({ data });

  return NextResponse.json(config);
}
