import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { AssetDetailClient } from "./asset-detail-client";

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const [asset, companies] = await Promise.all([
    prisma.asset.findUnique({
      where: { id },
      include: {
        assignments: {
          orderBy: { assignedAt: "desc" },
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, email: true, department: true },
            },
          },
        },
        services: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortCode: true },
    }),
  ]);

  if (!asset) return notFound();

  return (
    <>
      <Header title={`Demirbaş: ${asset.assetCode}`} />
      <div className="flex-1 overflow-auto p-6">
        <AssetDetailClient
          asset={JSON.parse(JSON.stringify(asset))}
          companies={companies}
          currentUserRole={session.user.role as string}
        />
      </div>
    </>
  );
}
