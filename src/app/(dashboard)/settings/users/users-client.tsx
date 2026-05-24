"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight, ShieldCheck } from "lucide-react";
import { ROLE_LABELS } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  phone: string | null;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  companyId: string | null;
}

interface UsersClientProps {
  users: User[];
  currentUserId: string;
  companies: Array<{ id: string; name: string; shortCode: string }>;
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN:     "bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20",
  IT_STAFF:  "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20",
  REQUESTER: "bg-gray-100 dark:bg-white/[0.05] text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-white/[0.08]",
};

const ALL_PERMISSIONS = [
  { key: "MANAGE_COMPANIES", label: "Firma Yönetimi",     desc: "Firma tanımlama ve düzenleme" },
  { key: "MANAGE_USERS",     label: "Kullanıcı Yönetimi", desc: "Kullanıcı ekleme, düzenleme, silme" },
  { key: "MANAGE_SLA",       label: "SLA Yapılandırma",   desc: "SLA kurallarını düzenleme" },
  { key: "MANAGE_EMAIL",     label: "E-posta Ayarları",   desc: "E-posta entegrasyon ayarları" },
];

export function UsersClient({ users: initialUsers, currentUserId, companies }: UsersClientProps) {
  const [users, setUsers]               = useState(initialUsers);
  const [showCreate, setShowCreate]     = useState(false);
  const [editingUser, setEditingUser]   = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [togglingId, setTogglingId]     = useState<string | null>(null);

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50 bg-white dark:bg-[#1a2420] text-gray-900 dark:text-slate-200";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1";

  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      password: fd.get("password") as string,
      role: fd.get("role") as string,
      department: (fd.get("department") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
    };
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error || "Hata oluştu");
      }
      setShowCreate(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEditUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const selectedRole = fd.get("role") as string;
    const perms = selectedRole === "IT_STAFF"
      ? ALL_PERMISSIONS.map(p => p.key).filter(k => fd.get(`perm_${k}`) === "on")
      : [];
    const data = {
      name: fd.get("name") as string,
      role: selectedRole,
      department: (fd.get("department") as string) || null,
      phone: (fd.get("phone") as string) || null,
      permissions: perms,
      companyId: editCompanyId,
    };
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error || "Hata oluştu");
      }
      const updated = await res.json() as User;
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        let msg = "Silinemedi";
        try { msg = (JSON.parse(text) as { error: string }).error || msg; } catch { /* non-json body */ }
        alert(msg);
        return;
      }
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setDeletingUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(user: User) {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        alert(err.error || "Hata oluştu");
        return;
      }
      const updated = await res.json() as User;
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    } finally {
      setTogglingId(null);
    }
  }

  // Edit modal — controlled fields for conditional UI
  const [editRole, setEditRole] = useState("");
  const [editCompanyId, setEditCompanyId] = useState<string | null>(null);

  function openEdit(user: User) {
    setEditingUser(user);
    setEditRole(user.role);
    setEditCompanyId(user.companyId);
    setError("");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-400 dark:text-slate-500">{users.length} kullanıcı</p>
        <button
          onClick={() => { setShowCreate(true); setError(""); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] transition-colors"
        >
          <Plus size={15} />
          Yeni Kullanıcı
        </button>
      </div>

      <div className="bg-white dark:bg-[#111813] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#0d120f] border-b border-gray-200 dark:border-white/[0.06]">
            <tr>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Kullanıcı</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Rol</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider hidden md:table-cell">Departman</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Durum</th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.03]">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#b6ff5a]/20 border border-[#b6ff5a]/30 flex items-center justify-center text-[#4a820c] dark:text-[#b6ff5a] font-bold text-sm shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate">{user.name}</span>
                        {user.permissions.length > 0 && (
                          <span title="Özel izinler atanmış"><ShieldCheck size={12} className="text-[#b6ff5a] shrink-0" /></span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-slate-500 truncate">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role] ?? ROLE_BADGE.REQUESTER}`}>
                    {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 hidden md:table-cell">
                  {user.department || <span className="text-gray-300 dark:text-slate-600">—</span>}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(user)}
                    disabled={togglingId === user.id || user.id === currentUserId}
                    title={user.id === currentUserId ? "Kendi hesabınızı devre dışı bırakamazsınız" : undefined}
                    className="flex items-center gap-1.5 text-xs font-medium disabled:opacity-40 transition-colors"
                  >
                    {user.isActive ? (
                      <><ToggleRight size={18} className="text-emerald-500" /><span className="text-emerald-600 dark:text-emerald-400">Aktif</span></>
                    ) : (
                      <><ToggleLeft size={18} className="text-gray-400 dark:text-slate-500" /><span className="text-gray-400 dark:text-slate-500">Pasif</span></>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(user)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                      title="Düzenle"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingUser(user)}
                      disabled={user.id === currentUserId}
                      title={user.id === currentUserId ? "Kendi hesabınızı silemezsiniz" : "Sil"}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111813] rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-white/[0.08]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
              <h3 className="text-base font-semibold text-gray-900 dark:text-slate-200">Yeni Kullanıcı</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div><label className={labelCls}>Ad Soyad *</label><input name="name" required className={inputCls} /></div>
              <div><label className={labelCls}>E-posta *</label><input name="email" type="email" required className={inputCls} /></div>
              <div><label className={labelCls}>Şifre *</label><input name="password" type="password" required minLength={8} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Rol *</label>
                <select name="role" defaultValue="REQUESTER" className={inputCls}>
                  <option value="REQUESTER">Talep Açan</option>
                  <option value="IT_STAFF">IT Personeli</option>
                  <option value="ADMIN">Yönetici</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Departman</label><input name="department" className={inputCls} /></div>
                <div><label className={labelCls}>Telefon</label><input name="phone" className={inputCls} /></div>
              </div>
              {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] disabled:opacity-50 transition-colors">
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111813] rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-white/[0.08] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06] sticky top-0 bg-white dark:bg-[#111813]">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-slate-200">Kullanıcıyı Düzenle</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{editingUser.email}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div><label className={labelCls}>Ad Soyad *</label><input name="name" required defaultValue={editingUser.name} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Rol *</label>
                <select name="role" value={editRole} onChange={e => setEditRole(e.target.value)} className={inputCls}>
                  <option value="REQUESTER">Talep Açan</option>
                  <option value="IT_STAFF">IT Personeli</option>
                  <option value="ADMIN">Yönetici</option>
                </select>
              </div>

              {/* Permissions — only for IT_STAFF */}
              {editRole === "IT_STAFF" && (
                <div className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.06] rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={14} className="text-[#b6ff5a]" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wide">Yönetim İzinleri</p>
                  </div>
                  {ALL_PERMISSIONS.map(perm => (
                    <label key={perm.key} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name={`perm_${perm.key}`}
                        defaultChecked={editingUser.permissions.includes(perm.key)}
                        className="mt-0.5 w-4 h-4 rounded accent-[#b6ff5a]"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{perm.label}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{perm.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Departman</label><input name="department" defaultValue={editingUser.department ?? ""} className={inputCls} /></div>
                <div><label className={labelCls}>Telefon</label><input name="phone" defaultValue={editingUser.phone ?? ""} className={inputCls} /></div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-[#aaa] mb-1">Firma</label>
                <select
                  value={editCompanyId ?? ""}
                  onChange={e => setEditCompanyId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-white/[0.08] rounded-lg text-sm bg-white dark:bg-[#0d120f] text-gray-900 dark:text-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#b6ff5a]/50"
                >
                  <option value="">— Firma seçiniz —</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.shortCode} — {c.name}</option>
                  ))}
                </select>
              </div>
              {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] disabled:opacity-50 transition-colors">
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#111813] rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-white/[0.08] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-slate-200">Kullanıcıyı Sil</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{deletingUser.name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-5">
              Bu kullanıcı kalıcı olarak silinecek. Atanmış talepleri serbest bırakılacak. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? "Siliniyor..." : "Evet, Sil"}
              </button>
              <button
                onClick={() => setDeletingUser(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
