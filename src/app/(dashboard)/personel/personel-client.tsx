"use client";

import { useState } from "react";
import { Plus, Pencil, UserX, Users2, Mail, Phone, Building2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  department: string | null;
  title: string | null;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  company: { shortCode: string; name: string };
  activeAssignmentCount: number;
}

interface PersonelClientProps {
  initialEmployees: Employee[];
  companies: Array<{ id: string; name: string; shortCode: string }>;
}

const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", phone: "",
  department: "", title: "", companyId: "", isActive: true,
};

export function PersonelClient({ initialEmployees, companies }: PersonelClientProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [filterCompanyId, setFilterCompanyId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState("");

  const filtered = filterCompanyId
    ? employees.filter(e => e.companyId === filterCompanyId)
    : employees;

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setShowModal(true);
  }

  function openEdit(emp: Employee) {
    setForm({
      firstName:  emp.firstName,
      lastName:   emp.lastName,
      email:      emp.email,
      phone:      emp.phone ?? "",
      department: emp.department ?? "",
      title:      emp.title ?? "",
      companyId:  emp.companyId,
      isActive:   emp.isActive,
    });
    setEditingId(emp.id);
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        firstName:  form.firstName,
        lastName:   form.lastName,
        email:      form.email,
        phone:      form.phone || null,
        department: form.department || null,
        title:      form.title || null,
        companyId:  form.companyId,
        isActive:   form.isActive,
      };

      const url = editingId ? `/api/employees/${editingId}` : "/api/employees";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: unknown;
      try { data = JSON.parse(text); } catch { data = {}; }

      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Bir hata oluştu");
        return;
      }

      const saved = data as Employee;
      const company = companies.find(c => c.id === saved.companyId) ?? { shortCode: "", name: "" };

      if (editingId) {
        setEmployees(prev => prev.map(e =>
          e.id === editingId
            ? { ...e, ...saved, company, activeAssignmentCount: e.activeAssignmentCount }
            : e
        ));
      } else {
        setEmployees(prev => [{
          ...saved,
          company,
          activeAssignmentCount: 0,
        }, ...prev]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    setError("");
    try {
      const res = await fetch(`/api/employees/${deactivateTarget.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Pasife alınamadı");
        return;
      }
      setEmployees(prev => prev.map(e =>
        e.id === deactivateTarget.id ? { ...e, isActive: false } : e
      ));
      setDeactivateTarget(null);
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={filterCompanyId}
            onChange={e => setFilterCompanyId(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-white/[0.06] rounded-lg text-sm bg-white dark:bg-[#111813] text-gray-900 dark:text-slate-200"
          >
            <option value="">Tüm Firmalar</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.shortCode} — {c.name}</option>
            ))}
          </select>
          <p className="text-sm text-gray-500 dark:text-slate-500">{filtered.length} personel</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] transition-colors"
        >
          <Plus size={15} />
          Personel Ekle
        </button>
      </div>

      {error && !showModal && !deactivateTarget && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-[#111813] rounded-2xl shadow-neu dark:shadow-neu-dark border border-white/80 dark:border-white/[0.04] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-[#444]">
            <Users2 size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz personel eklenmemiş.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-[#0d120f]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#555] uppercase tracking-wider">Personel</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#555] uppercase tracking-wider">Firma</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#555] uppercase tracking-wider">İletişim</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#555] uppercase tracking-wider">Zimmetler</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#555] uppercase tracking-wider">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/personel/${emp.id}`} className="block group">
                      <div className="text-sm font-medium text-gray-900 dark:text-[#e5e5e5] group-hover:text-[#b6ff5a]">
                        {emp.lastName}, {emp.firstName}
                      </div>
                      {emp.title && (
                        <div className="text-xs text-gray-400 dark:text-[#555]">{emp.title}</div>
                      )}
                      {emp.department && (
                        <div className="text-xs text-gray-400 dark:text-[#555]">{emp.department}</div>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#b6ff5a]/10 text-[#3d6b10] dark:bg-[rgba(182,255,90,0.1)] dark:text-[#b6ff5a] font-medium">
                      <Building2 size={10} />
                      {emp.company.shortCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-[#666] space-y-0.5">
                    <div className="flex items-center gap-1"><Mail size={10} />{emp.email}</div>
                    {emp.phone && <div className="flex items-center gap-1"><Phone size={10} />{emp.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-[#666]">
                    {emp.activeAssignmentCount > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{emp.activeAssignmentCount} demirbaş</span>
                    ) : (
                      <span className="text-gray-300 dark:text-[#444]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      emp.isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-[#666]"
                    )}>
                      {emp.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(emp)}
                        className="p-1.5 text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-[#aaa] hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Pencil size={13} />
                      </button>
                      {emp.isActive && (
                        <button
                          onClick={() => { setError(""); setDeactivateTarget(emp); }}
                          className="p-1.5 text-gray-400 dark:text-[#555] hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors"
                          title="Pasife Al"
                        >
                          <UserX size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111813] rounded-2xl shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-white/[0.06] max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-900 dark:text-[#e5e5e5] mb-5">
              {editingId ? "Personeli Düzenle" : "Yeni Personel Ekle"}
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Ad *</label>
                  <input
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Soyad *</label>
                  <input
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Firma *</label>
                <select
                  value={form.companyId}
                  onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                >
                  <option value="">— Firma seçiniz —</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.shortCode} — {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">E-posta *</label>
                <input
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Unvan</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Muhasebeci"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Departman</label>
                  <input
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    placeholder="Muhasebe"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Telefon</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="0212 123 45 67"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    id="empIsActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="empIsActive" className="text-sm text-gray-700 dark:text-[#aaa]">Aktif</label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving || !form.firstName || !form.lastName || !form.email || !form.companyId}
                className="flex-1 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] disabled:opacity-50 transition-colors"
              >
                {saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Ekle"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-[#aaa] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivateTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111813] rounded-2xl shadow-xl w-full max-w-sm p-6 border border-gray-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center shrink-0">
                <UserX size={18} className="text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-[#e5e5e5]">Personeli Pasife Al</h3>
                <p className="text-xs text-gray-500 dark:text-[#555]">Zimmetler iade edilmeden yapılamaz</p>
              </div>
            </div>
            {error && (
              <div className="mb-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>
            )}
            <p className="text-sm text-gray-600 dark:text-[#aaa] mb-5">
              <span className="font-semibold text-gray-900 dark:text-[#e5e5e5]">{deactivateTarget.lastName}, {deactivateTarget.firstName}</span> adlı personeli pasife almak istediğinizden emin misiniz?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeactivate}
                disabled={deactivating}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {deactivating ? "İşleniyor..." : "Pasife Al"}
              </button>
              <button
                onClick={() => { setDeactivateTarget(null); setError(""); }}
                disabled={deactivating}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-[#aaa] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
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
