"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Wrench, UserCheck, Trash2, CheckCircle, AlertTriangle, Pencil } from "lucide-react";
import { assignAsset, returnAsset, sendToService, completeService, scrappAsset, deleteAsset } from "@/lib/actions/asset.actions";
import { formatDate, formatDateShort, cn, ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, ASSET_CATEGORY_LABELS } from "@/lib/utils";

interface AssetDetailClientProps {
  asset: {
    id: string;
    assetCode: string;
    name: string;
    description: string | null;
    category: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    purchaseDate: string | null;
    purchasePrice: string | null;
    warrantyExpiry: string | null;
    status: string;
    location: string | null;
    notes: string | null;
    createdAt: string;
    assignments: Array<{
      id: string;
      isActive: boolean;
      assignedAt: string;
      returnedAt: string | null;
      notes: string | null;
      employee: { id: string; firstName: string; lastName: string; email: string; department: string | null };
    }>;
    services: Array<{
      id: string;
      type: string;
      description: string;
      cost: string | null;
      vendor: string | null;
      startDate: string;
      endDate: string | null;
      status: string;
      notes: string | null;
    }>;
  };
  companies: Array<{ id: string; name: string; shortCode: string }>;
  currentUserRole: string;
}

export function AssetDetailClient({ asset, companies, currentUserRole }: AssetDetailClientProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [availableEmployees, setAvailableEmployees] = useState<Array<{ id: string; firstName: string; lastName: string; department: string | null }>>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [assignNotes, setAssignNotes] = useState("");
  const [serviceType, setServiceType] = useState("REPAIR");
  const [serviceDesc, setServiceDesc] = useState("");
  const [serviceCost, setServiceCost] = useState("");
  const [serviceVendor, setServiceVendor] = useState("");

  const isAdmin = currentUserRole === "ADMIN";
  const isITStaff = currentUserRole === "IT_STAFF" || isAdmin;
  const activeAssignment = asset.assignments.find((a) => a.isActive);
  const activeService = asset.services.find((s) => s.status === "IN_PROGRESS");

  const warrantyExpiry = asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : null;
  const warrantyExpired = warrantyExpiry && warrantyExpiry < new Date();
  const daysToWarrantyExpiry = warrantyExpiry
    ? Math.floor((warrantyExpiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  async function handleAssign() {
    if (!selectedEmployeeId) return;
    setSubmitting(true);
    await assignAsset(asset.id, selectedEmployeeId, assignNotes || undefined);
    setShowAssignModal(false);
    setSubmitting(false);
  }

  async function fetchEmployees(companyId: string) {
    if (!companyId) { setAvailableEmployees([]); return; }
    setLoadingEmployees(true);
    try {
      const res = await fetch(`/api/employees?companyId=${companyId}&isActive=true`);
      const data = await res.json() as Array<{ id: string; firstName: string; lastName: string; department: string | null }>;
      setAvailableEmployees(data);
    } finally {
      setLoadingEmployees(false);
    }
  }

  async function handleReturn(assignmentId: string) {
    setSubmitting(true);
    await returnAsset(asset.id, assignmentId);
    setSubmitting(false);
  }

  async function handleSendToService() {
    if (!serviceDesc) return;
    setSubmitting(true);
    await sendToService(asset.id, {
      type: serviceType as never,
      description: serviceDesc,
      cost: serviceCost || undefined,
      vendor: serviceVendor || undefined,
    });
    setShowServiceModal(false);
    setSubmitting(false);
  }

  async function handleCompleteService(serviceId: string) {
    setSubmitting(true);
    await completeService(serviceId, asset.id);
    setSubmitting(false);
  }

  async function handleScrap() {
    if (!confirm("Bu demirbaşı hurdaya ayırmak istediğinizden emin misiniz?")) return;
    setSubmitting(true);
    await scrappAsset(asset.id);
    setSubmitting(false);
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await deleteAsset(asset.id);
    } catch (err) {
      console.error(err);
      setShowDeleteModal(false);
      setSubmitting(false);
    }
  }

  const SERVICE_TYPE_LABELS: Record<string, string> = { REPAIR: "Tamir", MAINTENANCE: "Bakım", WARRANTY: "Garanti" };
  const SERVICE_STATUS_LABELS: Record<string, string> = { IN_PROGRESS: "Devam Ediyor", COMPLETED: "Tamamlandı", CANCELLED: "İptal Edildi" };
  const SERVICE_STATUS_COLORS: Record<string, string> = {
    IN_PROGRESS: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-400",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
    CANCELLED: "bg-gray-100 text-gray-600 dark:bg-white/[0.05] dark:text-[#888]",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/assets" className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-400">
        <ArrowLeft size={16} />
        Demirbaşlar
      </Link>

      {warrantyExpired && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 dark:bg-red-500/10 dark:border-red-500/20">
          <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0" size={20} />
          <p className="text-red-800 dark:text-red-300 font-medium">Bu demirbaşın garanti süresi dolmuştur.</p>
        </div>
      )}
      {!warrantyExpired && daysToWarrantyExpiry !== null && daysToWarrantyExpiry <= 30 && daysToWarrantyExpiry > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 dark:bg-yellow-500/10 dark:border-yellow-500/20">
          <AlertTriangle className="text-yellow-600 dark:text-yellow-400 shrink-0" size={20} />
          <p className="text-yellow-800 dark:text-yellow-300 font-medium">Garanti süresi {daysToWarrantyExpiry} gün sonra sona erecek.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#111813] rounded-xl border border-gray-200 dark:border-white/[0.06] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-400 dark:text-slate-600 font-mono">{asset.assetCode}</span>
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", ASSET_STATUS_COLORS[asset.status as never])}>
                    {ASSET_STATUS_LABELS[asset.status as never]}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-200">{asset.name}</h2>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-gray-500 dark:text-slate-500 text-xs">Kategori</dt><dd className="font-medium dark:text-slate-300">{ASSET_CATEGORY_LABELS[asset.category as never]}</dd></div>
              {asset.brand && <div><dt className="text-gray-500 dark:text-slate-500 text-xs">Marka / Model</dt><dd className="font-medium dark:text-slate-300">{asset.brand} {asset.model}</dd></div>}
              {asset.serialNumber && <div><dt className="text-gray-500 dark:text-slate-500 text-xs">Seri No</dt><dd className="font-medium font-mono dark:text-slate-300">{asset.serialNumber}</dd></div>}
              {asset.location && <div><dt className="text-gray-500 dark:text-slate-500 text-xs">Konum</dt><dd className="font-medium dark:text-slate-300">{asset.location}</dd></div>}
              {asset.purchaseDate && <div><dt className="text-gray-500 dark:text-slate-500 text-xs">Satın Alma</dt><dd className="font-medium dark:text-slate-300">{formatDateShort(asset.purchaseDate)}</dd></div>}
              {asset.purchasePrice && <div><dt className="text-gray-500 dark:text-slate-500 text-xs">Fiyat</dt><dd className="font-medium dark:text-slate-300">₺{Number(asset.purchasePrice).toLocaleString("tr-TR")}</dd></div>}
              {asset.warrantyExpiry && (
                <div>
                  <dt className="text-gray-500 dark:text-slate-500 text-xs">Garanti Bitiş</dt>
                  <dd className={cn("font-medium", warrantyExpired ? "text-red-600" : daysToWarrantyExpiry! <= 30 ? "text-yellow-600" : "text-gray-900 dark:text-slate-200")}>
                    {formatDateShort(asset.warrantyExpiry)}
                  </dd>
                </div>
              )}
              {asset.notes && <div className="col-span-2"><dt className="text-gray-500 dark:text-slate-500 text-xs">Notlar</dt><dd className="text-gray-700 dark:text-slate-400 mt-1">{asset.notes}</dd></div>}
            </dl>
          </div>

          <div className="bg-white dark:bg-[#111813] rounded-xl border border-gray-200 dark:border-white/[0.06] p-6">
            <h3 className="font-semibold text-gray-900 dark:text-slate-200 flex items-center gap-2 mb-4">
              <Wrench size={18} />
              Servis / Tamir Geçmişi
            </h3>
            {asset.services.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-600 py-4 text-center">Servis kaydı bulunmuyor.</p>
            ) : (
              <div className="space-y-3">
                {asset.services.map((service) => (
                  <div key={service.id} className="border border-gray-100 dark:border-white/[0.07] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium dark:text-slate-300">{SERVICE_TYPE_LABELS[service.type]}</span>
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", SERVICE_STATUS_COLORS[service.status])}>
                          {SERVICE_STATUS_LABELS[service.status]}
                        </span>
                      </div>
                      {service.status === "IN_PROGRESS" && isITStaff && (
                        <button
                          onClick={() => handleCompleteService(service.id)}
                          disabled={submitting}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle size={12} />
                          Tamamla
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-slate-400">{service.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-slate-500">
                      {service.vendor && <span>Servis: {service.vendor}</span>}
                      {service.cost && <span>Maliyet: ₺{Number(service.cost).toLocaleString("tr-TR")}</span>}
                      <span>{formatDateShort(service.startDate)}</span>
                      {service.endDate && <span>→ {formatDateShort(service.endDate)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#111813] rounded-xl border border-gray-200 dark:border-white/[0.06] p-6">
            <h3 className="font-semibold text-gray-900 dark:text-slate-200 flex items-center gap-2 mb-4">
              <Package size={18} />
              Zimmet Geçmişi
            </h3>
            {asset.assignments.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-slate-600 py-4 text-center">Zimmet kaydı bulunmuyor.</p>
            ) : (
              <div className="space-y-3">
                {asset.assignments.map((assignment) => (
                  <div key={assignment.id} className={cn("border rounded-lg p-4", assignment.isActive ? "border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10" : "border-gray-100 dark:border-white/[0.07]")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-slate-200">{assignment.employee.firstName} {assignment.employee.lastName}</div>
                        {assignment.employee.department && <div className="text-xs text-gray-500 dark:text-slate-500">{assignment.employee.department}</div>}
                        <div className="text-xs text-gray-400 dark:text-slate-600 mt-1">
                          {formatDateShort(assignment.assignedAt)}
                          {assignment.returnedAt ? ` — ${formatDateShort(assignment.returnedAt)}` : " — Devam Ediyor"}
                        </div>
                        {assignment.notes && <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">{assignment.notes}</div>}
                      </div>
                      {assignment.isActive && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 px-2 py-0.5 rounded-full">Aktif</span>
                          {isITStaff && (
                            <button
                              onClick={() => handleReturn(assignment.id)}
                              disabled={submitting}
                              className="px-3 py-1.5 text-xs border border-gray-300 dark:border-white/[0.06] text-gray-700 dark:text-slate-400 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] disabled:opacity-50"
                            >
                              İade Al
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {isITStaff && (
            <div className="bg-white dark:bg-[#111813] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-400 flex items-center gap-2">
                <UserCheck size={16} />
                İşlemler
              </h3>

              <Link
                href={`/assets/${asset.id}/edit`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-white/[0.06] text-gray-700 dark:text-slate-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <Pencil size={14} />
                Düzenle
              </Link>

              {asset.status !== "SCRAP" && asset.status !== "RETIRED" && (
                <>
                  {!activeAssignment && !activeService && (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="w-full px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] transition-colors"
                    >
                      Zimmetle
                    </button>
                  )}

                  {!activeService && (
                    <button
                      onClick={() => setShowServiceModal(true)}
                      className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                    >
                      Servise Gönder
                    </button>
                  )}
                </>
              )}

              {isAdmin && asset.status !== "SCRAP" && (
                <button
                  onClick={handleScrap}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Hurdaya Ayır
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Demirbaşı Sil
                </button>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-[#111813] rounded-xl border border-gray-200 dark:border-white/[0.06] p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-400 mb-3">Maliyet Özeti</h3>
            <dl className="space-y-2 text-sm">
              {asset.purchasePrice && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-slate-500">Alış Fiyatı</dt>
                  <dd className="font-medium dark:text-slate-300">₺{Number(asset.purchasePrice).toLocaleString("tr-TR")}</dd>
                </div>
              )}
              {asset.services.filter(s => s.cost).length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-slate-500">Toplam Tamir</dt>
                  <dd className="font-medium text-orange-600 dark:text-orange-400">
                    ₺{asset.services.reduce((sum, s) => sum + (s.cost ? Number(s.cost) : 0), 0).toLocaleString("tr-TR")}
                  </dd>
                </div>
              )}
              {asset.purchasePrice && (
                <div className="flex justify-between border-t border-gray-100 dark:border-white/[0.07] pt-2 mt-2">
                  <dt className="text-gray-700 dark:text-slate-400 font-medium">Toplam Maliyet</dt>
                  <dd className="font-bold text-gray-900 dark:text-slate-200">
                    ₺{(Number(asset.purchasePrice) + asset.services.reduce((sum, s) => sum + (s.cost ? Number(s.cost) : 0), 0)).toLocaleString("tr-TR")}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111813] rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-white/[0.06]">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-200">Zimmetle</h3>
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Firma</label>
                  <select
                    value={selectedCompanyId}
                    onChange={e => {
                      setSelectedCompanyId(e.target.value);
                      setSelectedEmployeeId("");
                      fetchEmployees(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                  >
                    <option value="">Firma seçiniz</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.shortCode} — {c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">
                    Çalışan {loadingEmployees && <span className="text-gray-400">(yükleniyor...)</span>}
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={e => setSelectedEmployeeId(e.target.value)}
                    disabled={!selectedCompanyId || loadingEmployees}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 disabled:opacity-50"
                  >
                    <option value="">Çalışan seçiniz</option>
                    {availableEmployees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.lastName}, {e.firstName}{e.department ? ` — ${e.department}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Not</label>
                <textarea value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 bg-white dark:bg-[#0d120f] text-gray-900 dark:text-slate-200" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAssign} disabled={submitting || !selectedEmployeeId} className="flex-1 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] disabled:opacity-50">
                {submitting ? "Kaydediliyor..." : "Zimmetle"}
              </button>
              <button onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/[0.06] text-gray-700 dark:text-slate-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/[0.02]">İptal</button>
            </div>
          </div>
        </div>
      )}

      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111813] rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-white/[0.06]">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-200">Servise Gönder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Servis Tipi</label>
                <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50">
                  <option value="REPAIR">Tamir</option>
                  <option value="MAINTENANCE">Bakım</option>
                  <option value="WARRANTY">Garanti</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Açıklama *</label>
                <textarea value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} rows={3} placeholder="Arıza veya bakım açıklaması..." className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 bg-white dark:bg-[#0d120f] text-gray-900 dark:text-slate-200 placeholder:text-gray-400 placeholder:dark:text-slate-600" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Tahmini Maliyet (₺)</label>
                  <input type="number" value={serviceCost} onChange={(e) => setServiceCost(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 bg-white dark:bg-[#0d120f] text-gray-900 dark:text-slate-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Servis Firması</label>
                  <input value={serviceVendor} onChange={(e) => setServiceVendor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 bg-white dark:bg-[#0d120f] text-gray-900 dark:text-slate-200" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSendToService} disabled={!serviceDesc || submitting} className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 disabled:opacity-50">
                {submitting ? "Kaydediliyor..." : "Gönder"}
              </button>
              <button onClick={() => setShowServiceModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/[0.06] text-gray-700 dark:text-slate-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/[0.02]">İptal</button>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111813] rounded-xl shadow-xl w-full max-w-sm p-6 border border-gray-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-slate-200">Demirbaşı Sil</h3>
                <p className="text-xs text-gray-500 dark:text-slate-500">Bu işlem geri alınamaz</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
              <span className="font-medium text-gray-900 dark:text-slate-200">{asset.name}</span> ({asset.assetCode}) demirbaşını kalıcı olarak silmek istediğinizden emin misiniz? Tüm zimmet ve servis kayıtları da silinecektir.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Siliniyor..." : "Evet, Sil"}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/[0.06] text-gray-700 dark:text-slate-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
