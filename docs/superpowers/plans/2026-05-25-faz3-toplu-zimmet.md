# Faz 3: Toplu Zimmet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bir çalışana birden fazla demirbaşı tek işlemde zimmetlemeyi mümkün kılmak — hem personel cari sayfasından hem demirbaş listesinden.

**Architecture:** `bulkAssignAssets` server action tek Prisma transaction içinde tüm zimmetleri atomik oluşturur. Assets listesi `AssetsTableClient` client wrapper'ına taşınır; checkbox seçimi + aksiyon barı + modal bu bileşende yönetilir. Personel cari sayfasına "Toplu Zimmet Et" butonu + modal eklenir; ACTIVE demirbaşlar `/api/assets?status=ACTIVE` ile yüklenir.

**Tech Stack:** Next.js 15 App Router, Prisma ORM, TypeScript strict, Tailwind CSS, lucide-react, Zod

---

## File Map

| Durum | Dosya | Sorumluluk |
|-------|-------|-----------|
| **Modify** | `src/lib/actions/asset.actions.ts` | `bulkAssignAssets` action ekle |
| **Create** | `src/app/api/assets/route.ts` | GET — status filtreli asset listesi |
| **Create** | `src/app/(dashboard)/assets/assets-table-client.tsx` | Checkbox tablo, aksiyon barı, zimmet modal |
| **Modify** | `src/app/(dashboard)/assets/page.tsx` | Companies ekle, tablo AssetsTableClient'a devret |
| **Modify** | `src/app/(dashboard)/personel/[id]/cari-client.tsx` | Toplu Zimmet Et butonu + modal |

---

## Task 1: bulkAssignAssets Server Action

**Files:**
- Modify: `src/lib/actions/asset.actions.ts`

- [ ] **Step 1.1: `bulkAssignAssets` fonksiyonunu ekle**

`src/lib/actions/asset.actions.ts` dosyasının sonuna (son `}` dan önce değil, en sona) şunu ekle:

```typescript
export async function bulkAssignAssets(
  assetIds: string[],
  employeeId: string,
  note?: string
): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const role = session.user.role as string;
  if (role !== "ADMIN" && role !== "IT_STAFF") throw new Error("Forbidden");

  if (assetIds.length === 0) throw new Error("En az bir demirbaş seçilmeli");

  const assets = await prisma.asset.findMany({
    where: { id: { in: assetIds } },
    select: { id: true, status: true },
  });

  const nonActive = assets.filter((a) => a.status !== "ACTIVE");
  if (nonActive.length > 0) {
    throw new Error("Sadece ACTIVE statüsündeki demirbaşlar zimmetlenebilir");
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.assetAssignment.updateMany({
      where: { assetId: { in: assetIds }, isActive: true },
      data: { isActive: false, returnedAt: now },
    }),
    ...assetIds.map((assetId) =>
      prisma.assetAssignment.create({
        data: { assetId, employeeId, notes: note ?? null, isActive: true },
      })
    ),
    prisma.asset.updateMany({
      where: { id: { in: assetIds } },
      data: { status: "ASSIGNED" },
    }),
  ]);

  revalidatePath("/assets");
  revalidatePath("/personel");
  revalidatePath(`/personel/${employeeId}`);
}
```

- [ ] **Step 1.2: TypeScript kontrolü**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
npx tsc --noEmit 2>&1 | grep "asset.actions.ts"
```

Beklenen: `asset.actions.ts` satırına özgü hata yok.

- [ ] **Step 1.3: Commit**

```bash
git add src/lib/actions/asset.actions.ts
git commit -m "feat: add bulkAssignAssets server action"
```

---

## Task 2: GET /api/assets Route

**Files:**
- Create: `src/app/api/assets/route.ts`

- [ ] **Step 2.1: Dosyayı oluştur**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Oturum açılmamış" }, { status: 401 });
    }
    const role = session.user.role as string;
    if (role !== "ADMIN" && role !== "IT_STAFF") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const assets = await prisma.asset.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: {
        id: true,
        assetCode: true,
        name: true,
        category: true,
        brand: true,
        model: true,
        location: true,
      },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error("[assets GET]", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
```

- [ ] **Step 2.2: TypeScript kontrolü**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
npx tsc --noEmit 2>&1 | grep "api/assets/route.ts"
```

Beklenen: hata yok.

- [ ] **Step 2.3: Commit**

```bash
git add src/app/api/assets/route.ts
git commit -m "feat: add GET /api/assets with status filter"
```

---

## Task 3: AssetsTableClient — Checkbox Tablo + Toplu Zimmet Modalı

**Files:**
- Create: `src/app/(dashboard)/assets/assets-table-client.tsx`

- [ ] **Step 3.1: Dosyayı oluştur**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
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
                  asset.warrantyExpiry && isSlaBreached(asset.warrantyExpiry);
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
                      <Link href={`/assets/${asset.id}`} className="block">
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
                  ,{" "}
                  <span className="font-semibold text-[#3d6b10] dark:text-[#b6ff5a]">
                    {selectedEmployeeName}
                  </span>
                  &#39;a zimmetlenecek.
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
```

- [ ] **Step 3.2: TypeScript kontrolü**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
npx tsc --noEmit 2>&1 | grep "assets-table-client.tsx"
```

Beklenen: bu dosyaya özgü hata yok.

- [ ] **Step 3.3: Commit**

```bash
git add "src/app/(dashboard)/assets/assets-table-client.tsx"
git commit -m "feat: add AssetsTableClient with checkbox selection and bulk assign modal"
```

---

## Task 4: Assets Page — Companies Ekle, Tablo Client'a Devret

**Files:**
- Modify: `src/app/(dashboard)/assets/page.tsx`

- [ ] **Step 4.1: Dosyayı oku ve güncelle**

Mevcut dosyayı oku. Ardından tamamını şununla değiştir:

```typescript
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
```

- [ ] **Step 4.2: TypeScript kontrolü**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
npx tsc --noEmit 2>&1 | grep "assets/page.tsx"
```

Beklenen: bu dosyaya özgü hata yok.

- [ ] **Step 4.3: Commit**

```bash
git add "src/app/(dashboard)/assets/page.tsx"
git commit -m "feat: delegate assets table to AssetsTableClient, add companies for bulk assign"
```

---

## Task 5: CariClient — Toplu Zimmet Butonu + Modalı

**Files:**
- Modify: `src/app/(dashboard)/personel/[id]/cari-client.tsx`

- [ ] **Step 5.1: Import ekle**

Dosyanın en üstünde mevcut importlara `bulkAssignAssets` ve `PackagePlus` ekle:

```typescript
import { bulkAssignAssets } from "@/lib/actions/asset.actions";
import {
  Building2, Mail, Phone, Briefcase, Package, History, Wrench,
  Ticket, ArrowLeft, PackagePlus, X,
} from "lucide-react";
```

(`PackagePlus` ve `X` ekleniyor — diğerleri zaten mevcut.)

- [ ] **Step 5.2: State ve tip eklemeleri**

`CariClient` fonksiyonu içinde, mevcut state'lerin altına ekle:

```typescript
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
```

- [ ] **Step 5.3: Fonksiyonları ekle**

`handleReturn` fonksiyonundan hemen sonra şu fonksiyonları ekle:

```typescript
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
```

- [ ] **Step 5.4: Aktif Zimmetler sekmesine buton ekle**

`activeTab === "active"` bloğunun başında, tablo veya boş mesajdan önce şu satırı ekle:

```tsx
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
```

- [ ] **Step 5.5: Toplu zimmet modal JSX ekle**

Dosyanın JSX dönüşünde (`</div>` kapanış etiketlerinin en sonuna, `return` bloğunun içine) modalı ekle:

```tsx
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
```

- [ ] **Step 5.6: TypeScript kontrolü**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
npx tsc --noEmit 2>&1 | grep "cari-client.tsx"
```

Beklenen: bu dosyaya özgü hata yok.

- [ ] **Step 5.7: Commit**

```bash
git add "src/app/(dashboard)/personel/[id]/cari-client.tsx"
git commit -m "feat: add bulk assign button and modal to personel cari page"
```

---

## Self-Review

### Spec Coverage

| Gereksinim | Task |
|-----------|------|
| `bulkAssignAssets` atomik transaction | Task 1 |
| Sadece ACTIVE assets zimmetlenebilir | Task 1 (validate) |
| GET /api/assets?status=ACTIVE | Task 2 |
| Demirbaş listesinde checkbox seçimi | Task 3 |
| Sadece ACTIVE satırlarda checkbox aktif | Task 3 |
| Aksiyon barı (N seçildi + Zimmet Et) | Task 3 |
| Modal: firma → çalışan → not | Task 3 |
| Modal: onay ekranı | Task 3 |
| Assets page companies prop | Task 4 |
| Personel cari — Toplu Zimmet Et butonu | Task 5 |
| Personel cari — ACTIVE assets yükle | Task 5 |
| Personel cari — seçim + onay adımları | Task 5 |
| revalidatePath tüm ilgili rotalar | Task 1 |

Tüm gereksinimler karşılandı. ✅

### Placeholder Kontrolü

Hiçbir adımda TBD/TODO/eksik kod yok. ✅

### Tip Tutarlılığı

- `bulkAssignAssets(assetIds: string[], employeeId: string, note?: string)` Task 1'de tanımlanır; Task 3 ve Task 5'te aynı imzayla çağrılır. ✅
- `AssetRow.warrantyExpiry: string | null` Task 3 ve Task 4'te tutarlı. ✅
- `availableActiveAssets` array tipi Task 5'te tanımlanır ve `availableActiveAssets.filter(...)` ile tutarlı kullanılır. ✅
