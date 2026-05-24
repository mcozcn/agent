import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/header";
import Link from "next/link";
import { Plus, AlertTriangle, Search } from "lucide-react";
import { formatDate, TICKET_STATUS_LABELS, TICKET_STATUS_COLORS, PRIORITY_COLORS, PRIORITY_LABELS, cn } from "@/lib/utils";

interface SearchParams {
  status?: string;
  priority?: string;
  search?: string;
  filter?: string;
  assignee?: string;
  companyId?: string;
}

export default async function TicketsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth();
  if (!session?.user) return null;

  const params = await searchParams;

  const where: Record<string, unknown> = {};

  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }
  if (params.priority) {
    where.priority = params.priority;
  }
  if (params.filter === "breach") {
    where.slaBreach = true;
    where.status = { in: ["OPEN", "IN_PROGRESS"] };
  }
  if (params.assignee === "me") {
    where.assignedToId = session.user.id;
  }
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { ticketNumber: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.companyId && params.companyId !== "ALL") {
    where.companyId = params.companyId;
  }

  const [tickets, companies] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: [{ slaBreach: "desc" }, { createdAt: "desc" }],
      include: {
        requester: { select: { name: true, department: true } },
        assignedTo: { select: { name: true } },
        company: { select: { shortCode: true, name: true } },
      },
    }),
    prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortCode: true },
    }),
  ]);

  const role = session.user.role as string;

  return (
    <>
      <Header title="Talepler" />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <form className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-600" />
              <input
                name="search"
                defaultValue={params.search}
                placeholder="Talep numarası veya başlık ara..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 bg-white dark:bg-[#111813] text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-600"
              />
            </div>
            <select
              name="status"
              defaultValue={params.status || "ALL"}
              className="px-3 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 bg-white dark:bg-[#111813] text-gray-900 dark:text-slate-200"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="OPEN">Talep Gönderildi</option>
              <option value="IN_PROGRESS">İşleme Alındı</option>
              <option value="RESOLVED">Çözüme Ulaştı</option>
              <option value="UNRESOLVED">Çözüme Ulaşmadı</option>
              <option value="CLOSED">Kapatıldı</option>
            </select>
            <select
              name="priority"
              defaultValue={params.priority || ""}
              className="px-3 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 bg-white dark:bg-[#111813] text-gray-900 dark:text-slate-200"
            >
              <option value="">Tüm Öncelikler</option>
              <option value="CRITICAL">Kritik</option>
              <option value="HIGH">Yüksek</option>
              <option value="MEDIUM">Orta</option>
              <option value="LOW">Düşük</option>
            </select>
            <select
              name="companyId"
              defaultValue={params.companyId || "ALL"}
              className="px-3 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm focus:outline-none bg-white dark:bg-[#111813] text-gray-900 dark:text-slate-200"
            >
              <option value="ALL">Tüm Firmalar</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.shortCode} — {c.name}</option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.08] text-gray-700 dark:text-slate-400 rounded-lg text-sm font-medium transition-colors">
              Filtrele
            </button>
          </form>
          {(role === "ADMIN" || role === "IT_STAFF") && (
            <div className="flex gap-2">
              <Link
                href="?assignee=me"
                className="px-3 py-2 text-sm border border-gray-300 dark:border-white/[0.06] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] text-gray-700 dark:text-slate-400 transition-colors"
              >
                Bana Atanan
              </Link>
              <Link
                href="/tickets/new"
                className="flex items-center gap-2 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] transition-colors"
              >
                <Plus size={16} />
                Yeni Talep
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#111813] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0d120f] border-b border-gray-200 dark:border-white/[0.06]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Talep</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Durum</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Öncelik</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Talep Eden</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Atanan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">SLA</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase tracking-wider">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 dark:text-slate-600">Talep bulunamadı.</td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/tickets/${ticket.id}`} className="block">
                        <div className="text-xs text-gray-400 dark:text-slate-600 font-mono">
                          {ticket.ticketNumber}
                          {ticket.company && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#b6ff5a]/10 text-[#3d6b10] dark:bg-[rgba(182,255,90,0.1)] dark:text-[#b6ff5a] font-medium ml-1">
                              {ticket.company.shortCode}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate max-w-xs hover:text-[#b6ff5a]">{ticket.title}</div>
                        {ticket.category && <div className="text-xs text-gray-400 dark:text-slate-600">{ticket.category}</div>}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", TICKET_STATUS_COLORS[ticket.status])}>
                        {TICKET_STATUS_LABELS[ticket.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", PRIORITY_COLORS[ticket.priority])}>
                        {PRIORITY_LABELS[ticket.priority]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                      <div>{ticket.requester.name}</div>
                      {ticket.requester.department && <div className="text-xs text-gray-400 dark:text-slate-600">{ticket.requester.department}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                      {ticket.assignedTo?.name || <span className="text-gray-400 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {ticket.slaBreach ? (
                        <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                          <AlertTriangle size={12} />
                          İhlal
                        </span>
                      ) : ticket.slaDeadline ? (
                        <span className="text-xs text-gray-500 dark:text-slate-500">{formatDate(ticket.slaDeadline)}</span>
                      ) : (
                        <span className="text-gray-300 dark:text-slate-700">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-500">{formatDate(ticket.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
