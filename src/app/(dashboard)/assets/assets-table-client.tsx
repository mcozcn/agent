"use client";

import Link from "next/link";
import { useState } from "react";
import {
  cn,
  formatDateShort,
  ASSET_STATUS_LABELS,
  ASSET_STATUS_COLORS,
  ASSET_CATEGORY_LABELS,
  isSlaBreached,
} from "@/lib/utils";
import { bulkAssignAssets } from "@/lib/actions/asset.actions";
import { CheckSquare, X, Users } from "lucide-react";

interface AssetRow {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  status: string;
  location: string | null;
  warrantyExpiry: string | null;
  assignments: Array<{
    employee: { firstName: string; lastName: string; department: string | null };
  }>;
}

interface AssetsTableClientProps {
  assets: AssetRow[];
  totalCount: number;
  companies: Array<{ id: string; name: string; shortCode: string }>;
  currentUserRole: string;
}

type ModalStep = "form" | "confirm";

function differenceInDays(date1: Date, date2: Date): number {
  return Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
}

export function AssetsTableClient({
  assets,
  totalCount,
  companies,
  currentUserRole,
}: AssetsTableClientProps) {
  const canAssign = currentUserRole === "ADMIN" || currentUserRole === "IT_STAFF";

  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("form");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [availableEmployees, setAvailableEmployees] = useState<
    Array<{ id: string; firstName: string; lastName: string; department: string | null }>
  >([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const activeAssets = assets.filter((a) => a.status === "ACTIVE");
  const allActiveSelected =
    activeAssets.length > 0 &&
    activeAssets.every((a) => selectedIds.has(a.id));

  function toggleSelectAll() {
    if (allActiveSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeAssets.map((a) => a.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function openModal() {
    setModalStep("form");
    setSelectedCompanyId("");
    setSelectedEmployeeId("");
    setSelectedEmployeeName("");
    setAvailableEmployees([]);
    setNote("");
    setError("");
    setShowModal(true);
  }

  async function fetchEmployees(companyId: string) {
    if (!companyId) {
      setAvailableEmployees([]);
      return;
    }
    setLoadingEmployees(true);
    try {
      const res = await fetch(`/api/employees?companyId=${companyId}&isActive=true`);
      const data = (await res.json()) as Array<{
        id: string;
        firstName: string;
        lastName: string;
        department: string | null;
      }>;
      setAvailableEmployees(data);
    } finally {
      setLoadingEmployees(false);
    }
  }

  function handleEmployeeChange(employeeId: string) {
    setSelectedEmployeeId(employeeId);
    const emp = availableEmployees.find((e) => e.id === employeeId);
    setSelectedEmployeeName(emp ? `${emp.firstName} ${emp.lastName}` : "");
  }

  function goToConfirm() {
    if (!selectedEmployeeId) return;
    setModalStep("confirm");
  }

  async function handleBulkAssign() {
    setSubmitting(true);
    setError("");
    try {
      await bulkAssignAssets(Array.from(selectedIds), selectedEmployeeId, note || undefined);
      setShowModal(false);
      setSelectedIds(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
      setModalStep("form");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedAssets = assets.filter((a) => selectedIds.has(a.id));

  return (
    <div className="relative">
      <div className="bg-white dark:bg-[#111813] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-[#0d120f]">
          <span className="text-sm text-gray-500 dark:text-slate-500">
            Toplam {totalCount} demirbaş
          </span>
        </div>
        <table className="w-full">
          <thead className="border-b border-gray-200 dark:border-white/[0.06]">
            <tr>
              {canAssign && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allActiveSelected}
                    onChange={toggleSelectAll}
                    disabled={activeAssets.length === 0}
                    className="rounded"
                    title="Tüm aktif demirbaşları seç"
                  />
                </th>
              )}
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase">
                Demirbaş
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase">
                Kategori
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase">
                Durum
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase">
                Zimmetli
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase">
                Garanti
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-slate-500 uppercase">
                Konum
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
            {assets.length === 0 ? (
              <tr>
                <td
                  colSpan={canAssign ? 7 : 6}
                  className="px-4 py-12 text-center text-gray-400 dark:text-slate-600"
                >
                  Demirbaş bulunamadı.
                </td>
              </tr>
            ) : (
              assets.map((asset) => {
                const activeAssignment = asset.assignments[0];
                const warrantyExpired =
                  asset.warrantyExpiry && isSlaBreached(new Date(asset.warrantyExpiry));
                const warrantySoon =
                  asset.warrantyExpiry &&
                  !warrantyExpired &&
                  differenceInDays(new Date(asset.warrantyExpiry), new Date()) <= 30;
                const isSelectable = asset.status === "ACTIVE";
                const isSelected = selectedIds.has(asset.id);

                return (
                  <tr
                    key={asset.id}
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-white/[0.02]",
                      isSelected && "bg-[#b6ff5a]/5 dark:bg-[#b6ff5a]/5"
                    )}
                  >
                    {canAssign && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(asset.id)}
                          disabled={!isSelectable}
                          className="rounded disabled:opacity-30"
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Link href={`/assets/${asset.id}`}>
                        <div className="block">
                          <div className="text-xs text-gray-400 dark:text-slate-600 font-mono">
                            {asset.assetCode}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-slate-200 hover:text-[#b6ff5a]">
                            {asset.name}
                          </div>
                          {asset.brand && (
                            <div className="text-xs text-gray-400 dark:text-slate-600">
                              {asset.brand} {asset.model}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                      {ASSET_CATEGORY_LABELS[asset.category as keyof typeof ASSET_CATEGORY_LABELS]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          ASSET_STATUS_COLORS[asset.status as keyof typeof ASSET_STATUS_COLORS]
                        )}
                      >
                        {ASSET_STATUS_LABELS[asset.status as keyof typeof ASSET_STATUS_LABELS]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-400">
                      {activeAssignment ? (
                        <div>
                          <div>
                            {activeAssignment.employee.firstName}{" "}
                            {activeAssignment.employee.lastName}
                          </div>
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
                        <span
                          className={cn(
                            warrantyExpired
                              ? "text-red-600 font-medium"
                              : warrantySoon
                              ? "text-yellow-600 font-medium"
                              : "text-gray-500"
                          )}
                        >
                          {warrantyExpired && "Süresi Doldu: "}
                          {warrantySoon && "Bitiyor: "}
                          {formatDateShort(asset.warrantyExpiry)}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-500">
                      {asset.location || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Aksiyon Barı */}
      {canAssign && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-900 dark:bg-[#1a2a1a] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 z-40">
          <CheckSquare size={16} className="text-[#b6ff5a]" />
          <span className="text-sm font-medium">{selectedIds.size} demirbaş seçildi</span>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] transition-colors"
          >
            <Users size={14} />
            Zimmet Et
          </button>
          <button
            onClick={clearSelection}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Seçimi temizle"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111813] rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-white/[0.06]">
            {modalStep === "form" ? (
              <>
                <h3 className="text-base font-semibold text-gray-900 dark:text-[#e5e5e5] mb-1">
                  Toplu Zimmet
                </h3>
                <p className="text-xs text-gray-500 dark:text-[#666] mb-5">
                  {selectedIds.size} demirbaş seçildi
                </p>

                {error && (
                  <div className="mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">
                      Firma
                    </label>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => {
                        setSelectedCompanyId(e.target.value);
                        setSelectedEmployeeId("");
                        setSelectedEmployeeName("");
                        fetchEmployees(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                    >
                      <option value="">Firma seçiniz</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.shortCode} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">
                      Çalışan{" "}
                      {loadingEmployees && (
                        <span className="text-gray-400">(yükleniyor...)</span>
                      )}
                    </label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => handleEmployeeChange(e.target.value)}
                      disabled={!selectedCompanyId || loadingEmployees}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 disabled:opacity-50"
                    >
                      <option value="">Çalışan seçiniz</option>
                      {availableEmployees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.lastName}, {e.firstName}
                          {e.department ? ` — ${e.department}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">
                      Not (opsiyonel)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Tüm zimmetlere uygulanacak not..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={goToConfirm}
                    disabled={!selectedEmployeeId}
                    className="flex-1 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] disabled:opacity-50 transition-colors"
                  >
                    İleri →
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
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
                  <span className="font-semibold text-gray-900 dark:text-[#e5e5e5]">
                    {selectedIds.size} demirbaş
                  </span>
                  {", "}
                  <span className="font-semibold text-[#3d6b10] dark:text-[#b6ff5a]">
                    {selectedEmployeeName}
                  </span>
                  {"'a zimmetlenecek."}
                </p>

                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-lg p-3 max-h-48 overflow-y-auto space-y-1 mb-5">
                  {selectedAssets.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-sm">
                      <span className="text-xs font-mono text-gray-400 dark:text-[#555] w-20 shrink-0">
                        {a.assetCode}
                      </span>
                      <span className="text-gray-700 dark:text-[#ccc] truncate">{a.name}</span>
                    </div>
                  ))}
                </div>

                {note && (
                  <p className="text-xs text-gray-500 dark:text-[#666] mb-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2">
                    Not: {note}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleBulkAssign}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Zimmetleniyor..." : "Zimmet Et"}
                  </button>
                  <button
                    onClick={() => setModalStep("form")}
                    disabled={submitting}
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
