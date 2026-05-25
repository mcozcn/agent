"use client";

import { useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  Briefcase,
  Package,
  History,
  Wrench,
  Ticket,
  ArrowLeft,
  PackagePlus,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  cn,
  ASSET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from "@/lib/utils";
import { returnAsset, bulkAssignAssets } from "@/lib/actions/asset.actions";
import type { TicketStatus, Priority, AssetCategory } from "@/types";

interface EmployeeProp {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  department: string | null;
  title: string | null;
  isActive: boolean;
  company: { shortCode: string; name: string };
}

interface AssignmentProp {
  id: string;
  assetId: string;
  isActive: boolean;
  assignedAt: string;
  returnedAt: string | null;
  notes: string | null;
  asset: {
    id: string;
    assetCode: string;
    name: string;
    category: string;
  };
}

interface ServiceProp {
  id: string;
  assetId: string;
  type: string;
  description: string;
  cost: string | null;
  vendor: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  asset: { assetCode: string; name: string; category: string };
}

interface TicketProp {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface CariClientProps {
  employee: EmployeeProp;
  assignments: AssignmentProp[];
  services: ServiceProp[];
  tickets: TicketProp[];
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  REPAIR: "Onarım",
  MAINTENANCE: "Bakım",
  WARRANTY: "Garanti",
};

const SERVICE_STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "Devam Ediyor",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
};

const tabs = [
  { key: "active", label: "Aktif Zimmetler", icon: Package },
  { key: "history", label: "Zimmet Geçmişi", icon: History },
  { key: "services", label: "Servis Geçmişi", icon: Wrench },
  { key: "tickets", label: "İlgili Talepler", icon: Ticket },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function CariClient({
  employee,
  assignments,
  services,
  tickets,
}: CariClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [returning, setReturning] = useState<string | null>(null);

  // Toplu zimmet state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<"select" | "confirm">("select");
  const [availableActiveAssets, setAvailableActiveAssets] = useState<
    Array<{ id: string; assetCode: string; name: string; category: string; brand: string | null; location: string | null }>
  >([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());
  const [bulkNote, setBulkNote] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState("");

  const activeAssignments = assignments.filter((a) => a.isActive);
  const historyAssignments = assignments;

  function formatDuration(from: string, to: string | null): string {
    const start = new Date(from);
    const end = to ? new Date(to) : new Date();
    const days = Math.floor(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Bugün";
    if (days < 30) return `${days} gün`;
    if (days < 365) return `${Math.floor(days / 30)} ay`;
    return `${Math.floor(days / 365)} yıl`;
  }

  async function handleReturn(assetId: string, assignmentId: string) {
    setReturning(assignmentId);
    try {
      await returnAsset(assetId, assignmentId);
    } finally {
      setReturning(null);
    }
  }

  async function openBulkModal() {
    setShowBulkModal(true);
    setBulkStep("select");
    setBulkSelectedIds(new Set());
    setBulkNote("");
    setBulkError("");
    setLoadingAssets(true);
    try {
      const res = await fetch("/api/assets?status=ACTIVE");
      const data = await res.json() as Array<{
        id: string; assetCode: string; name: string; category: string;
        brand: string | null; location: string | null;
      }>;
      setAvailableActiveAssets(data);
    } finally {
      setLoadingAssets(false);
    }
  }

  function toggleBulkSelect(id: string) {
    setBulkSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkAssign() {
    setBulkSubmitting(true);
    setBulkError("");
    try {
      await bulkAssignAssets(Array.from(bulkSelectedIds), employee.id, bulkNote || undefined);
      setShowBulkModal(false);
      setBulkSelectedIds(new Set());
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Bir hata oluştu");
      setBulkStep("select");
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Üst kart */}
      <div className="bg-white dark:bg-[#111813] rounded-2xl shadow-neu dark:shadow-neu-dark border border-white/80 dark:border-white/[0.04] p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#b6ff5a]/15 dark:bg-[rgba(182,255,90,0.12)] flex items-center justify-center text-[#3d6b10] dark:text-[#b6ff5a] font-bold text-lg shrink-0">
              {employee.firstName.charAt(0)}
              {employee.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-[#e5e5e5]">
                {employee.lastName}, {employee.firstName}
              </h2>
              {employee.title && (
                <p className="text-sm text-gray-500 dark:text-[#888]">
                  {employee.title}
                </p>
              )}
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              employee.isActive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-[#666]"
            )}
          >
            {employee.isActive ? "Aktif" : "Pasif"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-[#aaa]">
            <Building2 size={14} className="text-gray-400 dark:text-[#555]" />
            <span className="font-medium text-[#3d6b10] dark:text-[#b6ff5a]">
              {employee.company.shortCode}
            </span>
            <span>{employee.company.name}</span>
          </div>
          {employee.department && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-[#aaa]">
              <Briefcase size={14} className="text-gray-400 dark:text-[#555]" />
              {employee.department}
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600 dark:text-[#aaa]">
            <Mail size={14} className="text-gray-400 dark:text-[#555]" />
            {employee.email}
          </div>
          {employee.phone && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-[#aaa]">
              <Phone size={14} className="text-gray-400 dark:text-[#555]" />
              {employee.phone}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-4 text-sm">
          {[
            {
              label: "Aktif Zimmet",
              value: activeAssignments.length,
              color: "text-blue-600 dark:text-blue-400",
            },
            {
              label: "Toplam Zimmet",
              value: historyAssignments.length,
              color: "text-gray-600 dark:text-[#aaa]",
            },
            {
              label: "Servis Kaydı",
              value: services.length,
              color: "text-orange-600 dark:text-orange-400",
            },
            {
              label: "İlgili Talep",
              value: tickets.length,
              color: "text-purple-600 dark:text-purple-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.03]"
            >
              <div className={`text-xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-400 dark:text-[#555]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sekmeler */}
      <div className="bg-white dark:bg-[#111813] rounded-2xl shadow-neu dark:shadow-neu-dark border border-white/80 dark:border-white/[0.04] overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-white/[0.05]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "text-gray-900 dark:text-[#e5e5e5] border-b-2 border-[#b6ff5a]"
                    : "text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-[#aaa]"
                )}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {/* Aktif Zimmetler */}
          {activeTab === "active" && (
            <div>
              {/* Toplu Zimmet Butonu */}
              <div className="flex justify-end mb-3">
                <button
                  onClick={openBulkModal}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[#b6ff5a] text-black rounded-lg hover:bg-[#9ee040] transition-colors"
                >
                  <PackagePlus size={14} />
                  Toplu Zimmet Et
                </button>
              </div>
              {activeAssignments.length === 0 ? (
                <p className="text-center py-8 text-gray-400 dark:text-[#444] text-sm">
                  Aktif zimmet yok.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-[#555] uppercase border-b border-gray-100 dark:border-white/[0.05]">
                      <th className="pb-2 pr-4">Demirbaş</th>
                      <th className="pb-2 pr-4">Kategori</th>
                      <th className="pb-2 pr-4">Zimmet Tarihi</th>
                      <th className="pb-2 pr-4">Süre</th>
                      <th className="pb-2 pr-4">Notlar</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                    {activeAssignments.map((a) => (
                      <tr key={a.id}>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/assets/${a.asset.id}`}
                            className="block hover:text-[#b6ff5a]"
                          >
                            <span className="block">
                              <span className="block text-xs font-mono text-gray-400 dark:text-[#555]">
                                {a.asset.assetCode}
                              </span>
                              <span className="block text-sm font-medium text-gray-900 dark:text-[#e5e5e5]">
                                {a.asset.name}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500 dark:text-[#666]">
                          {ASSET_CATEGORY_LABELS[
                            a.asset.category as AssetCategory
                          ] ?? a.asset.category}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500 dark:text-[#666]">
                          {new Date(a.assignedAt).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500 dark:text-[#666]">
                          {formatDuration(a.assignedAt, null)}
                        </td>
                        <td className="py-3 pr-4 text-xs text-gray-400 dark:text-[#555]">
                          {a.notes ?? "—"}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => handleReturn(a.assetId, a.id)}
                            disabled={returning === a.id}
                            className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-[#aaa] hover:bg-gray-50 dark:hover:bg-white/[0.03] disabled:opacity-50 transition-colors"
                          >
                            {returning === a.id ? "İade ediliyor..." : "İade Et"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Zimmet Geçmişi */}
          {activeTab === "history" && (
            <div>
              {historyAssignments.length === 0 ? (
                <p className="text-center py-8 text-gray-400 dark:text-[#444] text-sm">
                  Zimmet geçmişi yok.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-[#555] uppercase border-b border-gray-100 dark:border-white/[0.05]">
                      <th className="pb-2 pr-4">Demirbaş</th>
                      <th className="pb-2 pr-4">Zimmet</th>
                      <th className="pb-2 pr-4">İade</th>
                      <th className="pb-2 pr-4">Süre</th>
                      <th className="pb-2">Notlar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                    {historyAssignments.map((a) => (
                      <tr key={a.id}>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/assets/${a.asset.id}`}
                            className="block hover:text-[#b6ff5a]"
                          >
                            <span className="block">
                              <span className="block text-xs font-mono text-gray-400 dark:text-[#555]">
                                {a.asset.assetCode}
                              </span>
                              <span className="block text-sm font-medium text-gray-900 dark:text-[#e5e5e5]">
                                {a.asset.name}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500 dark:text-[#666]">
                          {new Date(a.assignedAt).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500 dark:text-[#666]">
                          {a.returnedAt ? (
                            new Date(a.returnedAt).toLocaleDateString("tr-TR")
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              Aktif
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500 dark:text-[#666]">
                          {formatDuration(a.assignedAt, a.returnedAt)}
                        </td>
                        <td className="py-3 text-xs text-gray-400 dark:text-[#555]">
                          {a.notes ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Servis Geçmişi */}
          {activeTab === "services" && (
            <div>
              {services.length === 0 ? (
                <p className="text-center py-8 text-gray-400 dark:text-[#444] text-sm">
                  Zimmetliyken servise giden demirbaş yok.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-[#555] uppercase border-b border-gray-100 dark:border-white/[0.05]">
                      <th className="pb-2 pr-4">Demirbaş</th>
                      <th className="pb-2 pr-4">Tür</th>
                      <th className="pb-2 pr-4">Başlangıç</th>
                      <th className="pb-2 pr-4">Bitiş</th>
                      <th className="pb-2 pr-4">Maliyet</th>
                      <th className="pb-2">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                    {services.map((s) => (
                      <tr key={s.id}>
                        <td className="py-3 pr-4">
                          <div className="text-xs font-mono text-gray-400 dark:text-[#555]">
                            {s.asset.assetCode}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-[#e5e5e5]">
                            {s.asset.name}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500 dark:text-[#666]">
                          {SERVICE_TYPE_LABELS[s.type] ?? s.type}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500 dark:text-[#666]">
                          {new Date(s.startDate).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500 dark:text-[#666]">
                          {s.endDate
                            ? new Date(s.endDate).toLocaleDateString("tr-TR")
                            : "—"}
                        </td>
                        <td className="py-3 pr-4 text-sm text-gray-500 dark:text-[#666]">
                          {s.cost
                            ? `₺${parseFloat(s.cost).toLocaleString("tr-TR")}`
                            : "—"}
                        </td>
                        <td className="py-3 text-xs">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 font-medium",
                              s.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                : s.status === "IN_PROGRESS"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                                : "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-[#666]"
                            )}
                          >
                            {SERVICE_STATUS_LABELS[s.status] ?? s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* İlgili Talepler */}
          {activeTab === "tickets" && (
            <div>
              {tickets.length === 0 ? (
                <p className="text-center py-8 text-gray-400 dark:text-[#444] text-sm">
                  {employee.email} adresinden gelen talep bulunamadı.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-[#555] uppercase border-b border-gray-100 dark:border-white/[0.05]">
                      <th className="pb-2 pr-4">Talep</th>
                      <th className="pb-2 pr-4">Durum</th>
                      <th className="pb-2 pr-4">Öncelik</th>
                      <th className="pb-2">Tarih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                    {tickets.map((t) => (
                      <tr key={t.id}>
                        <td className="py-3 pr-4">
                          <Link
                            href={`/tickets/${t.id}`}
                            className="block hover:text-[#b6ff5a]"
                          >
                            <span className="block">
                              <span className="block text-xs font-mono text-gray-400 dark:text-[#555]">
                                {t.ticketNumber}
                              </span>
                              <span className="block text-sm font-medium text-gray-900 dark:text-[#e5e5e5]">
                                {t.title}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              TICKET_STATUS_COLORS[t.status as TicketStatus] ??
                                ""
                            )}
                          >
                            {TICKET_STATUS_LABELS[t.status as TicketStatus] ??
                              t.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              PRIORITY_COLORS[t.priority as Priority] ?? ""
                            )}
                          >
                            {PRIORITY_LABELS[t.priority as Priority] ??
                              t.priority}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-gray-500 dark:text-[#666]">
                          {new Date(t.createdAt).toLocaleDateString("tr-TR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        <Link
          href="/personel"
          className="flex items-center gap-2 text-sm text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-[#aaa] transition-colors"
        >
          <span className="flex items-center gap-2">
            <ArrowLeft size={14} />
            Personel Listesine Dön
          </span>
        </Link>
      </div>

      {/* Toplu Zimmet Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111813] rounded-2xl shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-white/[0.06] max-h-[90vh] flex flex-col">
            {bulkStep === "select" ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-[#e5e5e5]">
                      Toplu Zimmet Et
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-[#666]">
                      {employee.lastName}, {employee.firstName}&#39;a zimmetlenecek demirbaşları seçin
                    </p>
                  </div>
                  <button onClick={() => setShowBulkModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                    <X size={16} />
                  </button>
                </div>

                {bulkError && (
                  <div className="mb-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg">
                    {bulkError}
                  </div>
                )}

                {loadingAssets ? (
                  <div className="flex-1 flex items-center justify-center py-12">
                    <p className="text-sm text-gray-400 dark:text-[#555]">Demirbaşlar yükleniyor...</p>
                  </div>
                ) : availableActiveAssets.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-12">
                    <p className="text-sm text-gray-400 dark:text-[#555]">Zimmetlenebilir aktif demirbaş bulunamadı.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-1 mb-4 min-h-0">
                    {availableActiveAssets.map(a => (
                      <label
                        key={a.id}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors",
                          bulkSelectedIds.has(a.id) && "bg-[#b6ff5a]/5 dark:bg-[#b6ff5a]/5"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={bulkSelectedIds.has(a.id)}
                          onChange={() => toggleBulkSelect(a.id)}
                          className="rounded shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-mono text-gray-400 dark:text-[#555]">{a.assetCode}</div>
                          <div className="text-sm font-medium text-gray-900 dark:text-[#e5e5e5] truncate">{a.name}</div>
                          {(a.brand || a.location) && (
                            <div className="text-xs text-gray-400 dark:text-[#555]">
                              {a.brand}{a.brand && a.location && " · "}{a.location}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">
                    Not (opsiyonel)
                  </label>
                  <textarea
                    value={bulkNote}
                    onChange={e => setBulkNote(e.target.value)}
                    rows={2}
                    placeholder="Tüm zimmetlere uygulanacak not..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 resize-none"
                  />
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setBulkStep("confirm")}
                    disabled={bulkSelectedIds.size === 0}
                    className="flex-1 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] disabled:opacity-50 transition-colors"
                  >
                    İleri ({bulkSelectedIds.size} seçildi)
                  </button>
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-[#aaa] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-gray-900 dark:text-[#e5e5e5] mb-1">
                  Zimmet Onayı
                </h3>
                <p className="text-sm text-gray-600 dark:text-[#aaa] mb-4">
                  <span className="font-semibold text-gray-900 dark:text-[#e5e5e5]">{bulkSelectedIds.size} demirbaş</span>,{" "}
                  <span className="font-semibold text-[#3d6b10] dark:text-[#b6ff5a]">{employee.lastName}, {employee.firstName}</span>&#39;a zimmetlenecek.
                </p>

                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 max-h-48 overflow-y-auto space-y-1 mb-4">
                  {availableActiveAssets.filter(a => bulkSelectedIds.has(a.id)).map(a => (
                    <div key={a.id} className="flex items-center gap-2 text-sm">
                      <span className="text-xs font-mono text-gray-400 dark:text-[#555] w-20 shrink-0">{a.assetCode}</span>
                      <span className="text-gray-700 dark:text-[#ccc] truncate">{a.name}</span>
                    </div>
                  ))}
                </div>

                {bulkNote && (
                  <p className="text-xs text-gray-500 dark:text-[#666] mb-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2">
                    Not: {bulkNote}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleBulkAssign}
                    disabled={bulkSubmitting}
                    className="flex-1 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] disabled:opacity-50 transition-colors"
                  >
                    {bulkSubmitting ? "Zimmetleniyor..." : "Zimmet Et"}
                  </button>
                  <button
                    onClick={() => setBulkStep("select")}
                    disabled={bulkSubmitting}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-[#aaa] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    ← Geri
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
