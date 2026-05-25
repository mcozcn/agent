# Faz 4: PDF Zimmet Tutanağı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zimmet işlemlerinden resmi PDF tutanağı üretmek — toplu zimmet sonrası başarı ekranından, personel cari aktif zimmetler sekmesinden ve zimmet geçmişi satırlarından indirilebilir.

**Architecture:** `@react-pdf/renderer` ile server-side PDF buffer üretimi. İki Next.js API route PDF stream döner. Client bileşenler `<a href target="_blank">` ile indirme başlatır; toplu zimmet sonrasında modal bir "başarı ekranı" adımına geçer.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, `@react-pdf/renderer`, Prisma ORM, lucide-react

---

## File Map

| Durum | Dosya | Sorumluluk |
|-------|-------|-----------|
| **Create** | `src/lib/pdf-templates/zimmet-tutanagi.tsx` | `@react-pdf/renderer` PDF bileşeni + `ZimmetPdfData` tipi |
| **Create** | `src/app/api/employees/[id]/assignments/pdf/route.tsx` | Tüm aktif zimmetler PDF |
| **Create** | `src/app/api/assets/assignments/[assignmentId]/pdf/route.tsx` | Tek zimmet PDF |
| **Modify** | `src/app/(dashboard)/assets/assets-table-client.tsx` | `"success"` modal adımı + PDF linki |
| **Modify** | `src/app/(dashboard)/personel/[id]/cari-client.tsx` | `"success"` bulk adımı + PDF butonları |

---

## Task 1: @react-pdf/renderer Kurulumu + PDF Şablon Bileşeni

**Files:**
- Modify: `package.json` (npm install)
- Create: `src/lib/pdf-templates/zimmet-tutanagi.tsx`

- [ ] **Step 1.1: Kütüphaneyi kur**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
npm install @react-pdf/renderer --legacy-peer-deps
```

Beklenen: `@react-pdf/renderer` `node_modules/` altına kurulur, `package.json` güncellenir. `--legacy-peer-deps` React 19 peer bağımlılık uyarısını atlar.

- [ ] **Step 1.2: `src/lib/pdf-templates/` dizini oluştur ve bileşeni yaz**

`src/lib/pdf-templates/zimmet-tutanagi.tsx` dosyasını oluştur:

```tsx
import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const CATEGORY_LABELS: Record<string, string> = {
  COMPUTER: "Masaüstü Bilgisayar",
  LAPTOP: "Dizüstü Bilgisayar",
  MONITOR: "Monitör",
  KEYBOARD: "Klavye",
  MOUSE: "Fare",
  PRINTER: "Yazıcı",
  PHONE: "Telefon",
  TABLET: "Tablet",
  NETWORK: "Ağ Cihazı",
  SERVER: "Sunucu",
  UPS: "UPS",
  OTHER: "Diğer",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface ZimmetPdfData {
  company: {
    name: string;
    address: string | null;
    phone: string | null;
  };
  employee: {
    firstName: string;
    lastName: string;
    title: string | null;
    department: string | null;
  };
  assignments: Array<{
    assetCode: string;
    name: string;
    category: string;
    brand: string | null;
    model: string | null;
    serialNumber: string | null;
    assignedAt: string;
    notes: string | null;
  }>;
  generatedAt: string;
}

const s = StyleSheet.create({
  page: { padding: 50, fontSize: 9, fontFamily: "Helvetica", color: "#1a1a1a" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    marginBottom: 12,
  },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  companyMeta: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  titleBlock: { alignItems: "flex-end" },
  docTitle: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  docDate: { fontSize: 8, color: "#6b7280", marginTop: 3 },
  divider: { borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", marginVertical: 10 },
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  infoRow: { flexDirection: "row", marginBottom: 3 },
  infoLabel: { fontSize: 8, color: "#6b7280", width: 70 },
  infoValue: { fontSize: 8, fontFamily: "Helvetica-Bold", flex: 1 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: "#e5e7eb",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },
  thCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280" },
  tdCell: { fontSize: 8, color: "#374151" },
  colNo: { width: 18 },
  colCode: { width: 58 },
  colName: { flex: 1 },
  colCat: { width: 78 },
  colBrand: { width: 78 },
  colSerial: { width: 68 },
  notesBox: {
    backgroundColor: "#f9fafb",
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    borderRadius: 3,
    padding: 8,
    marginTop: 10,
  },
  notesLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6b7280", marginBottom: 3 },
  notesText: { fontSize: 8, color: "#374151" },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 48,
  },
  signatureBox: { width: "44%" },
  signatureTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#374151", marginBottom: 24 },
  signatureLine: { borderTopWidth: 0.5, borderTopColor: "#9ca3af", marginBottom: 4 },
  signatureSub: { fontSize: 7, color: "#9ca3af" },
});

export function ZimmetTutanagi({ data }: { data: ZimmetPdfData }) {
  const { company, employee, assignments, generatedAt } = data;

  const notes = assignments
    .map((a) => a.notes)
    .filter((n): n is string => Boolean(n?.trim()));

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.companyName}>{company.name}</Text>
            {company.address ? <Text style={s.companyMeta}>{company.address}</Text> : null}
            {company.phone ? <Text style={s.companyMeta}>{company.phone}</Text> : null}
          </View>
          <View style={s.titleBlock}>
            <Text style={s.docTitle}>ZİMMET TUTANAĞI</Text>
            <Text style={s.docDate}>Tarih: {formatDate(generatedAt)}</Text>
          </View>
        </View>

        {/* Employee info */}
        <Text style={s.sectionLabel}>Zimmet Alan</Text>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Ad Soyad</Text>
          <Text style={s.infoValue}>{employee.lastName}, {employee.firstName}</Text>
        </View>
        {employee.title ? (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Unvan</Text>
            <Text style={s.infoValue}>{employee.title}</Text>
          </View>
        ) : null}
        {employee.department ? (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Departman</Text>
            <Text style={s.infoValue}>{employee.department}</Text>
          </View>
        ) : null}
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Firma</Text>
          <Text style={s.infoValue}>{company.name}</Text>
        </View>

        <View style={s.divider} />

        {/* Table */}
        <Text style={s.sectionLabel}>Zimmetli Demirbaşlar</Text>
        <View style={s.tableHeader}>
          <Text style={[s.thCell, s.colNo]}>#</Text>
          <Text style={[s.thCell, s.colCode]}>Kod</Text>
          <Text style={[s.thCell, s.colName]}>Demirbaş</Text>
          <Text style={[s.thCell, s.colCat]}>Kategori</Text>
          <Text style={[s.thCell, s.colBrand]}>Marka / Model</Text>
          <Text style={[s.thCell, s.colSerial]}>Seri No</Text>
        </View>
        {assignments.map((a, i) => (
          <View key={a.assetCode} style={s.tableRow}>
            <Text style={[s.tdCell, s.colNo]}>{i + 1}</Text>
            <Text style={[s.tdCell, s.colCode]}>{a.assetCode}</Text>
            <Text style={[s.tdCell, s.colName]}>{a.name}</Text>
            <Text style={[s.tdCell, s.colCat]}>{CATEGORY_LABELS[a.category] ?? a.category}</Text>
            <Text style={[s.tdCell, s.colBrand]}>
              {[a.brand, a.model].filter(Boolean).join(" ") || "—"}
            </Text>
            <Text style={[s.tdCell, s.colSerial]}>{a.serialNumber ?? "—"}</Text>
          </View>
        ))}

        {/* Notes */}
        {notes.length > 0 ? (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>NOT</Text>
            {notes.map((n, i) => (
              <Text key={i} style={s.notesText}>{n}</Text>
            ))}
          </View>
        ) : null}

        {/* Signatures */}
        <View style={s.signatureRow}>
          <View style={s.signatureBox}>
            <Text style={s.signatureTitle}>Zimmet Eden</Text>
            <View style={s.signatureLine} />
            <Text style={s.signatureSub}>Ad Soyad / İmza / Tarih</Text>
          </View>
          <View style={s.signatureBox}>
            <Text style={s.signatureTitle}>Zimmet Alan</Text>
            <View style={s.signatureLine} />
            <Text style={s.signatureSub}>{employee.lastName}, {employee.firstName} / İmza / Tarih</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 1.3: TypeScript kontrolü**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
npx tsc --noEmit 2>&1 | grep "zimmet-tutanagi"
```

Beklenen: bu dosyaya özgü TS hatası yok. Diğer dosyalardaki pre-existing hatalar (next/server, next-auth, Link children) normaldir — yok say.

- [ ] **Step 1.4: Commit**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
git add package.json package-lock.json src/lib/pdf-templates/zimmet-tutanagi.tsx
git commit -m "feat: add ZimmetTutanagi PDF template with @react-pdf/renderer"
```

---

## Task 2: GET /api/employees/[id]/assignments/pdf

**Files:**
- Create: `src/app/api/employees/[id]/assignments/pdf/route.tsx`

Not: `src/app/api/employees/[id]/` dizini zaten mevcut (`route.ts` içinde). Yeni bir `assignments/pdf/` alt dizini oluşturulacak.

- [ ] **Step 2.1: Dosyayı oluştur**

```tsx
import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { ZimmetTutanagi } from "@/lib/pdf-templates/zimmet-tutanagi";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Oturum açılmamış" }), { status: 401 });
    }
    const role = session.user.role as string;
    if (role !== "ADMIN" && role !== "IT_STAFF") {
      return new Response(JSON.stringify({ error: "Yetkisiz erişim" }), { status: 403 });
    }

    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        company: { select: { name: true, address: true, phone: true } },
        assignments: {
          where: { isActive: true },
          orderBy: { assignedAt: "asc" },
          include: {
            asset: {
              select: {
                assetCode: true,
                name: true,
                category: true,
                brand: true,
                model: true,
                serialNumber: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return new Response(JSON.stringify({ error: "Personel bulunamadı" }), { status: 404 });
    }

    if (employee.assignments.length === 0) {
      return new Response(JSON.stringify({ error: "Aktif zimmet bulunamadı" }), { status: 404 });
    }

    const now = new Date().toISOString();

    const pdfData = {
      company: employee.company,
      employee: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        title: employee.title,
        department: employee.department,
      },
      assignments: employee.assignments.map((a) => ({
        assetCode: a.asset.assetCode,
        name: a.asset.name,
        category: a.asset.category as string,
        brand: a.asset.brand,
        model: a.asset.model,
        serialNumber: a.asset.serialNumber,
        assignedAt: a.assignedAt.toISOString(),
        notes: a.notes,
      })),
      generatedAt: now,
    };

    const buffer = await renderToBuffer(
      React.createElement(ZimmetTutanagi, { data: pdfData })
    );

    const date = new Date().toLocaleDateString("tr-TR").replace(/\./g, "-");
    const filename = `zimmet-${employee.lastName}-${date}.pdf`;

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[employee assignments pdf GET]", error);
    return new Response(JSON.stringify({ error: "Sunucu hatası" }), { status: 500 });
  }
}
```

- [ ] **Step 2.2: TypeScript kontrolü**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
npx tsc --noEmit 2>&1 | grep "employees/\[id\]/assignments/pdf"
```

Beklenen: hata yok.

- [ ] **Step 2.3: Commit**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
git add "src/app/api/employees/[id]/assignments/pdf/route.tsx"
git commit -m "feat: add GET /api/employees/[id]/assignments/pdf route"
```

---

## Task 3: GET /api/assets/assignments/[assignmentId]/pdf

**Files:**
- Create: `src/app/api/assets/assignments/[assignmentId]/pdf/route.tsx`

Not: `src/app/api/assets/assignments/` dizini henüz yok — oluşturulacak.

- [ ] **Step 3.1: Dosyayı oluştur**

```tsx
import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { ZimmetTutanagi } from "@/lib/pdf-templates/zimmet-tutanagi";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Oturum açılmamış" }), { status: 401 });
    }
    const role = session.user.role as string;
    if (role !== "ADMIN" && role !== "IT_STAFF") {
      return new Response(JSON.stringify({ error: "Yetkisiz erişim" }), { status: 403 });
    }

    const { assignmentId } = await params;

    const assignment = await prisma.assetAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        asset: {
          select: {
            assetCode: true,
            name: true,
            category: true,
            brand: true,
            model: true,
            serialNumber: true,
          },
        },
        employee: {
          select: {
            firstName: true,
            lastName: true,
            title: true,
            department: true,
            company: {
              select: { name: true, address: true, phone: true },
            },
          },
        },
      },
    });

    if (!assignment) {
      return new Response(JSON.stringify({ error: "Zimmet kaydı bulunamadı" }), { status: 404 });
    }

    const now = new Date().toISOString();

    const pdfData = {
      company: assignment.employee.company,
      employee: {
        firstName: assignment.employee.firstName,
        lastName: assignment.employee.lastName,
        title: assignment.employee.title,
        department: assignment.employee.department,
      },
      assignments: [
        {
          assetCode: assignment.asset.assetCode,
          name: assignment.asset.name,
          category: assignment.asset.category as string,
          brand: assignment.asset.brand,
          model: assignment.asset.model,
          serialNumber: assignment.asset.serialNumber,
          assignedAt: assignment.assignedAt.toISOString(),
          notes: assignment.notes,
        },
      ],
      generatedAt: now,
    };

    const buffer = await renderToBuffer(
      React.createElement(ZimmetTutanagi, { data: pdfData })
    );

    const date = new Date().toLocaleDateString("tr-TR").replace(/\./g, "-");
    const filename = `zimmet-${assignment.asset.assetCode}-${date}.pdf`;

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[assignment pdf GET]", error);
    return new Response(JSON.stringify({ error: "Sunucu hatası" }), { status: 500 });
  }
}
```

- [ ] **Step 3.2: TypeScript kontrolü**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
npx tsc --noEmit 2>&1 | grep "assets/assignments/\[assignmentId\]"
```

Beklenen: hata yok.

- [ ] **Step 3.3: Commit**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
git add "src/app/api/assets/assignments/[assignmentId]/pdf/route.tsx"
git commit -m "feat: add GET /api/assets/assignments/[assignmentId]/pdf route"
```

---

## Task 4: AssetsTableClient — Başarı Ekranı + PDF Linki

**Files:**
- Modify: `src/app/(dashboard)/assets/assets-table-client.tsx`

- [ ] **Step 4.1: Dosyayı oku**

`src/app/(dashboard)/assets/assets-table-client.tsx` dosyasını oku. Değiştirilecek noktaları belirle:
1. `ModalStep` tipi
2. `handleBulkAssign` fonksiyonu
3. İkon importları
4. Modal JSX'inin sonu (başarı adımı eklenecek)

- [ ] **Step 4.2: Değişiklikleri uygula**

**a) `ModalStep` tipine `"success"` ekle:**

```typescript
type ModalStep = "form" | "confirm" | "success";
```

**b) `Check` ve `FileDown` ikonlarını lucide-react importuna ekle:**

Mevcut: `import { CheckSquare, X, Users } from "lucide-react";`
Yeni: `import { CheckSquare, X, Users, Check, FileDown } from "lucide-react";`

**c) `handleBulkAssign` fonksiyonunu şununla değiştir:**

```typescript
async function handleBulkAssign() {
  setSubmitting(true);
  setError("");
  try {
    await bulkAssignAssets(Array.from(selectedIds), selectedEmployeeId, note || undefined);
    setModalStep("success");
    router.refresh();
  } catch (e) {
    setError(e instanceof Error ? e.message : "Bir hata oluştu");
    setModalStep("form");
  } finally {
    setSubmitting(false);
  }
}
```

**d) `closeModal` fonksiyonunu `openModal` fonksiyonunun hemen altına ekle:**

```typescript
function closeModal() {
  setShowModal(false);
  setSelectedIds(new Set());
  setModalStep("form");
}
```

**e) Modal JSX'inde `confirm` adımının kapanış `</>` ve ardından `</> ` (modal bileşeninin sonu) arasına `success` adımını ekle:**

Mevcut modal yapısı şöyle biter:
```tsx
            ) : (
              <>
                {/* confirm adımı içeriği */}
              </>
            )}
          </div>
        </div>
      )}
```

`confirm` adımının JSX'ini bulan `</>` den sonra, `modalStep === "confirm"` dalına denk gelen üçlü operatörün _ikinci_ koşulunu aşağıdaki gibi genişlet — yani `modalStep === "confirm"` kontrolü yerine iki adımlı nested ternary:

```tsx
{modalStep === "form" ? (
  <>
    {/* mevcut form adımı — değişmez */}
  </>
) : modalStep === "confirm" ? (
  <>
    {/* mevcut confirm adımı — değişmez */}
  </>
) : (
  /* success adımı */
  <>
    <div className="text-center py-4">
      <div className="w-12 h-12 rounded-full bg-[#b6ff5a]/20 dark:bg-[#b6ff5a]/10 flex items-center justify-center mx-auto mb-3">
        <Check size={24} className="text-[#3d6b10] dark:text-[#b6ff5a]" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-[#e5e5e5] mb-1">
        Zimmet Tamamlandı
      </h3>
      <p className="text-sm text-gray-500 dark:text-[#666]">
        <span className="font-semibold text-gray-900 dark:text-[#e5e5e5]">
          {selectedIds.size} demirbaş
        </span>
        {", "}
        <span className="font-semibold text-[#3d6b10] dark:text-[#b6ff5a]">
          {selectedEmployeeName}
        </span>
        {"'a zimmetlendi."}
      </p>
    </div>
    <div className="flex gap-3 mt-6">
      <a
        href={`/api/employees/${selectedEmployeeId}/assignments/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] transition-colors"
      >
        <FileDown size={14} />
        PDF İndir
      </a>
      <button
        onClick={closeModal}
        className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-[#aaa] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
      >
        Kapat
      </button>
    </div>
  </>
)}
```

- [ ] **Step 4.3: TypeScript kontrolü**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
npx tsc --noEmit 2>&1 | grep "assets-table-client"
```

Beklenen: bu dosyaya özgü hata yok.

- [ ] **Step 4.4: Commit**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
git add "src/app/(dashboard)/assets/assets-table-client.tsx"
git commit -m "feat: add success state with PDF download to AssetsTableClient"
```

---

## Task 5: CariClient — Başarı Ekranı + PDF Butonları

**Files:**
- Modify: `src/app/(dashboard)/personel/[id]/cari-client.tsx`

- [ ] **Step 5.1: Dosyayı oku**

`src/app/(dashboard)/personel/[id]/cari-client.tsx` dosyasını oku. Değiştirilecek noktalar:
1. `bulkStep` tipi
2. `handleBulkAssign` fonksiyonu
3. İkon importları (`Check`, `FileDown`, `FileText` eklenecek)
4. `closeBulkModal` fonksiyonu ekleme
5. Bulk modal JSX'ine success adımı
6. Aktif zimmetler sekmesine "PDF Al" butonu
7. Zimmet geçmişi sekmesine satır bazlı PDF ikonu

- [ ] **Step 5.2: Değişiklikleri uygula**

**a) `bulkStep` tipine `"success"` ekle:**

Mevcut: `const [bulkStep, setBulkStep] = useState<"select" | "confirm">("select");`
Yeni: `const [bulkStep, setBulkStep] = useState<"select" | "confirm" | "success">("select");`

**b) `Check`, `FileDown`, `FileText` ikonlarını lucide-react importuna ekle:**

Mevcut:
```typescript
import {
  Building2, Mail, Phone, Briefcase, Package, History, Wrench,
  Ticket, ArrowLeft, PackagePlus, X,
} from "lucide-react";
```
Yeni:
```typescript
import {
  Building2, Mail, Phone, Briefcase, Package, History, Wrench,
  Ticket, ArrowLeft, PackagePlus, X, Check, FileDown, FileText,
} from "lucide-react";
```

**c) `handleBulkAssign` fonksiyonunu şununla değiştir:**

```typescript
async function handleBulkAssign() {
  setBulkSubmitting(true);
  setBulkError("");
  try {
    await bulkAssignAssets(Array.from(bulkSelectedIds), employee.id, bulkNote || undefined);
    setBulkStep("success");
    router.refresh();
  } catch (e) {
    setBulkError(e instanceof Error ? e.message : "Bir hata oluştu");
    setBulkStep("select");
  } finally {
    setBulkSubmitting(false);
  }
}
```

**d) `openBulkModal` fonksiyonunun hemen altına `closeBulkModal` ekle:**

```typescript
function closeBulkModal() {
  setShowBulkModal(false);
  setBulkSelectedIds(new Set());
  setBulkStep("select");
}
```

**e) Bulk modal JSX'inde `confirm` adımının sonuna success adımını ekle:**

Mevcut modal ternary:
```tsx
{bulkStep === "select" ? (
  <>...</>
) : (
  <>...</>  {/* confirm */}
)}
```

Şu şekilde genişlet:
```tsx
{bulkStep === "select" ? (
  <>
    {/* mevcut select içeriği — değişmez */}
  </>
) : bulkStep === "confirm" ? (
  <>
    {/* mevcut confirm içeriği — değişmez, FAKAT son "İptal" butonunun onClick'ini closeBulkModal ile güncelle */}
  </>
) : (
  /* success adımı */
  <>
    <div className="text-center py-4">
      <div className="w-12 h-12 rounded-full bg-[#b6ff5a]/20 dark:bg-[#b6ff5a]/10 flex items-center justify-center mx-auto mb-3">
        <Check size={24} className="text-[#3d6b10] dark:text-[#b6ff5a]" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-[#e5e5e5] mb-1">
        Zimmet Tamamlandı
      </h3>
      <p className="text-sm text-gray-500 dark:text-[#666]">
        <span className="font-semibold text-gray-900 dark:text-[#e5e5e5]">
          {bulkSelectedIds.size} demirbaş
        </span>
        {" "}
        <span className="font-semibold text-[#3d6b10] dark:text-[#b6ff5a]">
          {employee.lastName}, {employee.firstName}
        </span>
        {"'a zimmetlendi."}
      </p>
    </div>
    <div className="flex gap-3 mt-6">
      <a
        href={`/api/employees/${employee.id}/assignments/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#b6ff5a] text-black rounded-lg text-sm font-medium hover:bg-[#9ee040] transition-colors"
      >
        <FileDown size={14} />
        PDF İndir
      </a>
      <button
        onClick={closeBulkModal}
        className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-[#aaa] rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
      >
        Kapat
      </button>
    </div>
  </>
)}
```

**f) Aktif Zimmetler sekmesine "PDF Al" butonu ekle:**

Mevcut "Toplu Zimmet Et" butonunun bulunduğu `<div className="flex justify-end mb-3">` içine, "Toplu Zimmet Et" butonundan önce bir PDF butonu ekle:

```tsx
<div className="flex justify-end gap-2 mb-3">
  <a
    href={`/api/employees/${employee.id}/assignments/pdf`}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-[#aaa] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
  >
    <FileDown size={14} />
    PDF Al
  </a>
  <button
    onClick={openBulkModal}
    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[#b6ff5a] text-black rounded-lg hover:bg-[#9ee040] transition-colors"
  >
    <PackagePlus size={14} />
    Toplu Zimmet Et
  </button>
</div>
```

**g) Zimmet Geçmişi sekmesine satır bazlı PDF ikonu ekle:**

Zimmet geçmişi tablosunda her satırın son hücresine (genellikle süre veya tarih hücresinin yanına) PDF ikonu ekle:

```tsx
<td className="px-4 py-3 text-right">
  <a
    href={`/api/assets/assignments/${a.id}/pdf`}
    target="_blank"
    rel="noopener noreferrer"
    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-[#aaa] rounded inline-flex"
    title="PDF İndir"
  >
    <FileText size={14} />
  </a>
</td>
```

Önce mevcut "Zimmet Geçmişi" tablo yapısını oku — `<th>` sayısını gör ve ona göre yeni sütun ekle (header'a da boş `<th>` eklenmeli).

- [ ] **Step 5.3: TypeScript kontrolü**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
npx tsc --noEmit 2>&1 | grep "cari-client"
```

Beklenen: bu dosyaya özgü hata yok.

- [ ] **Step 5.4: Commit**

```bash
cd /Users/mucahit.ozcan/Documents/GitHub/ResolveIT
git add "src/app/(dashboard)/personel/[id]/cari-client.tsx"
git commit -m "feat: add bulk assign success state and PDF buttons to cari page"
```

---

## Self-Review

### Spec Coverage

| Gereksinim | Task |
|-----------|------|
| `@react-pdf/renderer` server-side PDF | Task 1 |
| `ZimmetPdfData` tipi + bileşen | Task 1 |
| GET /api/employees/[id]/assignments/pdf | Task 2 |
| GET /api/assets/assignments/[assignmentId]/pdf | Task 3 |
| PDF içeriği: firma başlığı | Task 1 |
| PDF içeriği: personel bilgileri | Task 1 |
| PDF içeriği: demirbaş tablosu | Task 1 |
| PDF içeriği: notlar (varsa) | Task 1 |
| PDF içeriği: imza alanları | Task 1 |
| Boş alanlar atlanır (address, phone, title, department) | Task 1 |
| `assignedAt` eskiden yeniye sıralaması | Task 2 |
| Auth 401/403 her iki route'ta | Task 2, Task 3 |
| Toplu zimmet başarı ekranı — AssetsTableClient | Task 4 |
| Toplu zimmet başarı ekranı — CariClient | Task 5 |
| Aktif zimmetler sekmesi "PDF Al" butonu | Task 5 |
| Zimmet geçmişi satır bazlı PDF ikonu | Task 5 |
| Content-Disposition: attachment, dosya adı | Task 2, Task 3 |

Tüm gereksinimler karşılandı. ✅

### Placeholder Kontrolü

TBD/TODO yok. Her adımda gerçek kod mevcut. ✅

### Tip Tutarlılığı

- `ZimmetPdfData` Task 1'de tanımlanır; Task 2 ve Task 3'te `pdfData` aynı shape ile oluşturulur. ✅
- `bulkStep: "select" | "confirm" | "success"` Task 5'te tutarlı. ✅
- `ModalStep: "form" | "confirm" | "success"` Task 4'te tutarlı. ✅
