import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/header";
import Link from "next/link";
import { Plus, Search, AlertTriangle } from "lucide-react";
import { formatDateShort, ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, ASSET_CATEGORY_LABELS, cn } from "@/lib/utils";
import { isSlaBreached } from "@/lib/utils";

interface SearchParams {
  status?: string;
  category?: string;
  search?: string;
}

export default async function AssetsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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

  const [assets, totalCount] = await Promise.all([
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
  ]);

  const warrantyExpiringSoon = assets.filter(
    (a) => a.warrantyExpiry && differenceInDays(new Date(a.warrantyExpiry), new Date()) <= 30 && differenceInDays(new Date(a.warrantyExpiry), new Date()) > 0
  );

  const role = session.user.role as string;

  return (
    <>
      <Header title="Demirbaşlar" />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        {warrantyExpiringSoon.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 dark:bg-yellow-500/10 dark:border-yellow-500/20">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400 shrink-0" size={20} />
            <p className="text-yellow-800 dark:text-yellow-300 text-sm">
              <span className="font-medium">{warrantyExpiringSoon.length} demirbaşın</span> garantisi 30 gün içinde bitiyor.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <form className="flex items-center gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600" />
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
            <button type="submit" className="px-4 py-2 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] text-gray-700 dark:text-slate-400 rounded-lg text-sm font-medium">
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

        <div className="bg-white dark:bg-[#111813] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#0d120f]">
            <span className="text-sm text-gray-500 dark:text-slate-500">Toplam {totalCount} demirbaş</span>
          </div>
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-white/[0.06]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase">Demirbaş</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase">Kategori</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase">Durum</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase">Zimmetli</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase">Garanti</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase">Konum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 dark:text-slate-600">Demirbaş bulunamadı.</td>
                </tr>
              ) : (
                assets.map((asset) => {
                  const activeAssignment = asset.assignments[0];
                  const warrantyExpired = asset.warrantyExpiry && isSlaBreached(asset.warrantyExpiry);
                  const warrantySoon = asset.warrantyExpiry && !warrantyExpired &&
                    differenceInDays(new Date(asset.warrantyExpiry), new Date()) <= 30;

                  return (
                    <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <Link href={`/assets/${asset.id}`} className="block">
                          <div className="text-xs text-gray-400 dark:text-slate-600 font-mono">{asset.assetCode}</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-slate-200 hover:text-[#b6ff5a]">{asset.name}</div>
                          {asset.brand && <div className="text-xs text-gray-400 dark:text-slate-600">{asset.brand} {asset.model}</div>}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                        {ASSET_CATEGORY_LABELS[asset.category]}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", ASSET_STATUS_COLORS[asset.status])}>
                          {ASSET_STATUS_LABELS[asset.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                        {activeAssignment ? (
                          <div>
                            <div>{activeAssignment.employee.firstName} {activeAssignment.employee.lastName}</div>
                            {activeAssignment.employee.department && (
                              <div className="text-xs text-gray-400 dark:text-slate-600">
                                {activeAssignment.employee.department}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {asset.warrantyExpiry ? (
                          <span className={cn(
                            warrantyExpired ? "text-red-600 font-medium" :
                            warrantySoon ? "text-yellow-600 font-medium" : "text-gray-500"
                          )}>
                            {warrantyExpired && "Süresi Doldu: "}
                            {warrantySoon && "Bitiyor: "}
                            {formatDateShort(asset.warrantyExpiry)}
                          </span>
                        ) : <span className="text-gray-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-500">{asset.location || "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function differenceInDays(date1: Date, date2: Date): number {
  return Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
}
