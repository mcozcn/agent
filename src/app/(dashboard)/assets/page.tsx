import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/header";
import Link from "next/link";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { AssetsTableClient } from "./assets-table-client";

interface SearchParams {
  status?: string;
  category?: string;
  search?: string;
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const params = await searchParams;
  const where: Record<string, unknown> = {};

  if (params.status && params.status !== "ALL") where.status = params.status;
  if (params.category) where.category = params.category;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { assetCode: { contains: params.search, mode: "insensitive" } },
      { serialNumber: { contains: params.search, mode: "insensitive" } },
      { brand: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [assets, totalCount, companies] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            employee: { select: { firstName: true, lastName: true, department: true } },
          },
        },
      },
    }),
    prisma.asset.count(),
    prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortCode: true },
    }),
  ]);

  const role = session.user.role as string;

  const serializedAssets = assets.map((a) => ({
    ...a,
    purchaseDate: a.purchaseDate?.toISOString() ?? null,
    purchasePrice: a.purchasePrice?.toString() ?? null,
    warrantyExpiry: a.warrantyExpiry?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  const warrantyExpiringSoon = assets.filter((a) => {
    if (!a.warrantyExpiry) return false;
    const days = Math.floor(
      (new Date(a.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days <= 30 && days > 0;
  });

  return (
    <>
      <Header title="Demirbaşlar" />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {warrantyExpiringSoon.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 dark:bg-yellow-500/10 dark:border-yellow-500/20">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400 shrink-0" size={20} />
            <p className="text-yellow-800 dark:text-yellow-300 text-sm">
              <span className="font-medium">{warrantyExpiringSoon.length} demirbaşın</span> garantisi
              30 gün içinde bitiyor.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <form className="flex items-center gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600"
              />
              <input
                name="search"
                defaultValue={params.search}
                placeholder="Demirbaş kodu, isim, seri no..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 bg-white dark:bg-[#111813] text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-600"
              />
            </div>
            <select
              name="status"
              defaultValue={params.status || "ALL"}
              className="px-3 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm focus:outline-none bg-white dark:bg-[#111813] text-gray-900 dark:text-slate-200"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="ACTIVE">Aktif</option>
              <option value="ASSIGNED">Zimmetli</option>
              <option value="IN_SERVICE">Serviste</option>
              <option value="SCRAP">Hurda</option>
              <option value="RETIRED">Kullanım Dışı</option>
            </select>
            <select
              name="category"
              defaultValue={params.category || ""}
              className="px-3 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm focus:outline-none bg-white dark:bg-[#111813] text-gray-900 dark:text-slate-200"
            >
              <option value="">Tüm Kategoriler</option>
              <option value="COMPUTER">Masaüstü Bilgisayar</option>
              <option value="LAPTOP">Dizüstü Bilgisayar</option>
              <option value="MONITOR">Monitör</option>
              <option value="PRINTER">Yazıcı</option>
              <option value="PHONE">Telefon</option>
              <option value="TABLET">Tablet</option>
              <option value="NETWORK">Ağ Cihazı</option>
              <option value="SERVER">Sunucu</option>
              <option value="UPS">UPS</option>
              <option value="OTHER">Diğer</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] text-gray-700 dark:text-slate-400 rounded-lg text-sm font-medium"
            >
              Filtrele
            </button>
          </form>
          <Link
            href="/assets/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040]"
          >
            <Plus size={16} />
            Yeni Demirbaş
          </Link>
        </div>

        <AssetsTableClient
          assets={serializedAssets}
          totalCount={totalCount}
          companies={companies}
          currentUserRole={role}
        />
      </div>
    </>
  );
}
