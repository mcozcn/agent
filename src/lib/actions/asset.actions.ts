"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateAssetCode } from "@/lib/utils";
import type { AssetCategory, AssetStatus, ServiceType } from "@prisma/client";

const createAssetSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.enum(["COMPUTER", "LAPTOP", "MONITOR", "KEYBOARD", "MOUSE", "PRINTER", "PHONE", "TABLET", "NETWORK", "SERVER", "UPS", "OTHER"]),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export async function createAsset(data: {
  name: string;
  category: AssetCategory;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  warrantyExpiry?: string;
  location?: string;
  description?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "IT_STAFF") throw new Error("Forbidden");

  const validated = createAssetSchema.parse(data);
  const count = await prisma.asset.count();
  const assetCode = generateAssetCode(count);

  const asset = await prisma.asset.create({
    data: {
      assetCode,
      name: validated.name,
      category: validated.category,
      brand: validated.brand,
      model: validated.model,
      serialNumber: validated.serialNumber,
      purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : null,
      purchasePrice: validated.purchasePrice ? parseFloat(validated.purchasePrice) : null,
      warrantyExpiry: validated.warrantyExpiry ? new Date(validated.warrantyExpiry) : null,
      location: validated.location,
      description: validated.description,
      notes: validated.notes,
    },
  });

  revalidatePath("/assets");
  redirect("/assets");
}

const updateAssetSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.enum(["COMPUTER", "LAPTOP", "MONITOR", "KEYBOARD", "MOUSE", "PRINTER", "PHONE", "TABLET", "NETWORK", "SERVER", "UPS", "OTHER"]),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export async function updateAsset(
  id: string,
  data: {
    name: string;
    category: AssetCategory;
    brand?: string;
    model?: string;
    serialNumber?: string;
    location?: string;
    warrantyExpiry?: string;
    purchaseDate?: string;
    purchasePrice?: string;
    description?: string;
    notes?: string;
  }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "IT_STAFF") throw new Error("Forbidden");

  const validated = updateAssetSchema.parse(data);

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      name: validated.name,
      category: validated.category,
      brand: validated.brand ?? null,
      model: validated.model ?? null,
      serialNumber: validated.serialNumber ?? null,
      location: validated.location ?? null,
      warrantyExpiry: validated.warrantyExpiry ? new Date(validated.warrantyExpiry) : null,
      purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : null,
      purchasePrice: validated.purchasePrice ? parseFloat(validated.purchasePrice) : null,
      description: validated.description ?? null,
      notes: validated.notes ?? null,
    },
  });

  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  redirect(`/assets/${id}`);
}

export async function assignAsset(assetId: string, employeeId: string, notes?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "IT_STAFF") throw new Error("Forbidden");

  await prisma.assetAssignment.updateMany({
    where: { assetId, isActive: true },
    data: { isActive: false, returnedAt: new Date() },
  });

  await prisma.assetAssignment.create({
    data: { assetId, employeeId, notes, isActive: true },
  });

  await prisma.asset.update({
    where: { id: assetId },
    data: { status: "ASSIGNED" },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
}

export async function returnAsset(assetId: string, assignmentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.assetAssignment.update({
    where: { id: assignmentId },
    data: { isActive: false, returnedAt: new Date() },
  });

  await prisma.asset.update({
    where: { id: assetId },
    data: { status: "ACTIVE" },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
}

export async function sendToService(assetId: string, data: {
  type: ServiceType;
  description: string;
  cost?: string;
  vendor?: string;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "IT_STAFF") throw new Error("Forbidden");

  await prisma.assetService.create({
    data: {
      assetId,
      type: data.type,
      description: data.description,
      cost: data.cost ? parseFloat(data.cost) : null,
      vendor: data.vendor,
      notes: data.notes,
      status: "IN_PROGRESS",
    },
  });

  await prisma.asset.update({
    where: { id: assetId },
    data: { status: "IN_SERVICE" },
  });

  // Return from any active assignments
  await prisma.assetAssignment.updateMany({
    where: { assetId, isActive: true },
    data: { isActive: false, returnedAt: new Date() },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
}

export async function completeService(serviceId: string, assetId: string, cost?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.assetService.update({
    where: { id: serviceId },
    data: {
      status: "COMPLETED",
      endDate: new Date(),
      cost: cost ? parseFloat(cost) : undefined,
    },
  });

  await prisma.asset.update({
    where: { id: assetId },
    data: { status: "ACTIVE" },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
}

export async function scrappAsset(assetId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const role = session.user.role as string;
  if (role !== "ADMIN") throw new Error("Forbidden");

  await prisma.asset.update({
    where: { id: assetId },
    data: { status: "SCRAP" },
  });

  await prisma.assetAssignment.updateMany({
    where: { assetId, isActive: true },
    data: { isActive: false, returnedAt: new Date() },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath("/assets");
}

export async function deleteAsset(assetId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const role = session.user.role as string;
  if (role !== "ADMIN") throw new Error("Forbidden");

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error("Demirbaş bulunamadı");

  // Unlink from tickets (set assetId null)
  await prisma.ticket.updateMany({ where: { assetId }, data: { assetId: null } });

  // Cascade: AssetAssignment and AssetService deleted automatically via schema onDelete: Cascade
  await prisma.asset.delete({ where: { id: assetId } });

  revalidatePath("/assets");
  redirect("/assets");
}

export async function bulkAssignAssets(
  assetIds: string[],
  employeeId: string,
  note?: string
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "IT_STAFF") throw new Error("Forbidden");

  if (assetIds.length === 0) throw new Error("En az bir demirbaş seçilmeli");

  const assets = await prisma.asset.findMany({
    where: { id: { in: assetIds } },
    select: { id: true, status: true },
  });

  const nonActive = assets.filter((a) => a.status !== "ACTIVE");
  if (nonActive.length > 0) {
    throw new Error("Sadece ACTIVE statüsündeki demirbaşlar zimmetlenebilir");
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.assetAssignment.updateMany({
      where: { assetId: { in: assetIds }, isActive: true },
      data: { isActive: false, returnedAt: now },
    }),
    ...assetIds.map((assetId) =>
      prisma.assetAssignment.create({
        data: { assetId, employeeId, notes: note ?? null, isActive: true },
      })
    ),
    prisma.asset.updateMany({
      where: { id: { in: assetIds } },
      data: { status: "ASSIGNED" },
    }),
  ]);

  revalidatePath("/assets");
  revalidatePath("/personel");
  revalidatePath(`/personel/${employeeId}`);
}
