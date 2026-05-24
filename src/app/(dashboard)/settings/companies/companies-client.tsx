"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Building2, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface Company {
  id: string;
  name: string;
  shortCode: string;
  emailDomains: string[];
  address: string | null;
  phone: string | null;
  website: string | null;
  isActive: boolean;
  contactName: string | null;
  contactEmail: string | null;
  createdAt: string;
  userCount: number;
  ticketCount: number;
}

interface CompaniesClientProps {
  initialCompanies: Company[];
}

const EMPTY_FORM = {
  name: "", shortCode: "", emailDomains: "",
  address: "", phone: "", website: "",
  contactName: "", contactEmail: "", isActive: true,
};

export function CompaniesClient({ initialCompanies }: CompaniesClientProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
    setShowModal(true);
  }

  function openEdit(company: Company) {
    setForm({
      name: company.name,
      shortCode: company.shortCode,
      emailDomains: company.emailDomains.join("\n"),
      address: company.address ?? "",
      phone: company.phone ?? "",
      website: company.website ?? "",
      contactName: company.contactName ?? "",
      contactEmail: company.contactEmail ?? "",
      isActive: company.isActive,
    });
    setEditingId(company.id);
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        shortCode: form.shortCode,
        emailDomains: form.emailDomains
          .split("\n")
          .map(d => d.trim())
          .filter(d => d.length > 0),
        address:      form.address || null,
        phone:        form.phone || null,
        website:      form.website || null,
        contactName:  form.contactName || null,
        contactEmail: form.contactEmail || null,
        isActive:     form.isActive,
      };

      const url = editingId ? `/api/companies/${editingId}` : "/api/companies";
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

      const saved = data as Company;
      if (editingId) {
        setCompanies(prev => prev.map(c =>
          c.id === editingId
            ? { ...c, ...saved, userCount: c.userCount, ticketCount: c.ticketCount }
            : c
        ));
      } else {
        setCompanies(prev => [{ ...saved, userCount: 0, ticketCount: 0 }, ...prev]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/companies/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "Silinemedi");
        return;
      }
      setCompanies(prev => prev.filter(c => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-[#e5e5e5]">Firmalar</h2>
          <p className="text-xs text-gray-400 dark:text-[#555] mt-0.5">{companies.length} firma tanımlı</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] transition-colors"
        >
          <Plus size={15} />
          Firma Ekle
        </button>
      </div>

      {error && !showModal && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-[#111813] rounded-2xl shadow-neu dark:shadow-neu-dark border border-white/80 dark:border-white/[0.04] overflow-hidden">
        {companies.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-[#444]">
            <Building2 size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Henüz firma eklenmemiş.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-[#0d120f]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#555] uppercase tracking-wider">Firma</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#555] uppercase tracking-wider">E-posta Domainleri</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#555] uppercase tracking-wider">Yetkili</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#555] uppercase tracking-wider">Kullanıcı / Talep</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#555] uppercase tracking-wider">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
              {companies.map(company => (
                <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#b6ff5a]/15 text-[#3d6b10] dark:bg-[rgba(182,255,90,0.12)] dark:text-[#b6ff5a] text-xs font-bold shrink-0">
                        {company.shortCode}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-[#e5e5e5]">{company.name}</div>
                        {company.phone && (
                          <div className="text-xs text-gray-400 dark:text-[#555] flex items-center gap-1 mt-0.5">
                            <Phone size={10} />{company.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {company.emailDomains.length === 0 ? (
                        <span className="text-xs text-gray-300 dark:text-[#444]">—</span>
                      ) : company.emailDomains.slice(0, 3).map(d => (
                        <span key={d} className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 font-mono">
                          {d}
                        </span>
                      ))}
                      {company.emailDomains.length > 3 && (
                        <span className="text-[10px] text-gray-400 dark:text-[#555]">+{company.emailDomains.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-[#888]">
                    {company.contactName ? (
                      <div>
                        <div>{company.contactName}</div>
                        {company.contactEmail && (
                          <div className="text-xs text-gray-400 dark:text-[#555] flex items-center gap-1">
                            <Mail size={10} />{company.contactEmail}
                          </div>
                        )}
                      </div>
                    ) : <span className="text-gray-300 dark:text-[#444]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-[#666]">
                    {company.userCount} kullanıcı · {company.ticketCount} talep
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      company.isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-500 dark:bg-white/[0.05] dark:text-[#666]"
                    )}>
                      {company.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(company)}
                        className="p-1.5 text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-[#aaa] hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => { setError(""); setDeleteTarget(company); }}
                        className="p-1.5 text-gray-400 dark:text-[#555] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={13} />
                      </button>
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
              {editingId ? "Firmayı Düzenle" : "Yeni Firma Ekle"}
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Firma Adı *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="ABC Holding A.Ş."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Kısa Kod *</label>
                  <input
                    value={form.shortCode}
                    onChange={e => setForm(f => ({ ...f, shortCode: e.target.value.toUpperCase() }))}
                    placeholder="ABC"
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm font-mono bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-[#aaa]">Aktif</label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">
                  E-posta Domainleri
                  <span className="text-gray-400 dark:text-[#555] font-normal ml-1">(her satıra bir tane, @domain.com formatında)</span>
                </label>
                <textarea
                  value={form.emailDomains}
                  onChange={e => setForm(f => ({ ...f, emailDomains: e.target.value }))}
                  rows={3}
                  placeholder={"@abc.com\n@abc.com.tr\n@abcholding.com"}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm font-mono bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Yetkili Kişi</label>
                  <input
                    value={form.contactName}
                    onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                    placeholder="Ad Soyad"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Yetkili E-posta</label>
                  <input
                    value={form.contactEmail}
                    onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                    placeholder="yetkili@abc.com"
                    type="email"
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
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Website</label>
                  <input
                    value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://abc.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Adres</label>
                <textarea
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.shortCode}
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111813] rounded-2xl shadow-xl w-full max-w-sm p-6 border border-gray-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-[#e5e5e5]">Firmayı Sil</h3>
                <p className="text-xs text-gray-500 dark:text-[#555]">Bu işlem geri alınamaz</p>
              </div>
            </div>
            {error && (
              <div className="mb-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg">{error}</div>
            )}
            <p className="text-sm text-gray-600 dark:text-[#aaa] mb-5">
              <span className="font-semibold text-gray-900 dark:text-[#e5e5e5]">{deleteTarget.name}</span> firmasını silmek istediğinizden emin misiniz?{" "}
              {deleteTarget.userCount + deleteTarget.ticketCount > 0 && (
                <span className="text-orange-600 dark:text-orange-400">
                  Bu firmaya bağlı {deleteTarget.userCount} kullanıcı ve {deleteTarget.ticketCount} talep firma bilgisiz kalacak.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Siliniyor..." : "Evet, Sil"}
              </button>
              <button
                onClick={() => { setDeleteTarget(null); setError(""); }}
                disabled={deleting}
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
