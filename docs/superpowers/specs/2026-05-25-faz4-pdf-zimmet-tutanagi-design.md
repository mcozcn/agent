# Faz 4: PDF Zimmet Tutanağı — Tasarım Dokümanı

**Tarih:** 2026-05-25
**Durum:** Onaylı

---

## Amaç

Zimmet işlemlerinden resmi, imzalanabilir PDF tutanağı üretmek. Hem toplu zimmet akışından hem personel cari sayfasından erişilebilir; hem tek zimmet hem tüm aktif zimmetler kapsanır.

---

## Kapsam

**Dahil:**
- `@react-pdf/renderer` ile server-side PDF üretimi
- İki API route: tüm aktif zimmetler + tek zimmet
- Toplu zimmet sonrası başarı ekranında PDF indirme
- Personel cari aktif zimmetler sekmesinde "PDF Al" butonu
- Personel cari zimmet geçmişi sekmesinde satır bazlı PDF ikonu

**Dışarıda (sonraki fazlar):**
- Logo yükleme / firma görsel kimliği
- PDF e-posta ile gönderme (Faz 5)
- Şablon özelleştirme arayüzü

---

## Kütüphane

**`@react-pdf/renderer`** — Next.js API route içinde server-side render, Vercel uyumlu, gerçek metin (aranabilir/kopyalanabilir), Türkçe karakter desteği.

---

## API Route'ları

### `GET /api/employees/[id]/assignments/pdf`

Personelin **tüm aktif zimmetlerini** tek PDF olarak döner.

- Auth: ADMIN veya IT_STAFF
- Veri: `employee` + `company` + aktif `AssetAssignment[]` (her biri `asset` include)
- Response: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="zimmet-[lastName]-[tarih].pdf"`

### `GET /api/assets/assignments/[assignmentId]/pdf`

**Tek bir zimmet kaydını** PDF olarak döner.

- Auth: ADMIN veya IT_STAFF
- Veri: `AssetAssignment` + `asset` + `employee` + `company`
- `isActive` kontrolü: aktif olmayan zimmet için de PDF üretilir (geçmişe dönük erişim)
- Response: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="zimmet-[assetCode]-[tarih].pdf"`

---

## PDF İçeriği

```
────────────────────────────────────────────────────────
  [Firma Adı]                          ZİMMET TUTANAĞI
  [Adres]                              Tarih: GG.AA.YYYY
  [Telefon]
────────────────────────────────────────────────────────
  Zimmet Alan : Ad Soyad
  Unvan       : ...           Departman : ...
  Firma       : ...
────────────────────────────────────────────────────────
  #  Demirbaş Kodu  İsim              Kategori   Marka/Model   Seri No
  1  AST-001        Dell Laptop       Dizüstü    Dell XPS 15   SN12345
  2  AST-002        HP Monitor        Monitör    HP Z27        SN67890
────────────────────────────────────────────────────────
  Not: [notes — varsa gösterilir, yoksa bu satır çıkmaz]
────────────────────────────────────────────────────────
  Zimmet Eden                    Zimmet Alan
  ___________________________    ___________________________
  Ad Soyad / İmza / Tarih        Ad Soyad / İmza / Tarih
────────────────────────────────────────────────────────
```

**Alan notları:**
- Firma bilgileri `company.name`, `company.address`, `company.phone` — boş alanlar atlanır
- Logo alanı şimdilik boş bırakılır (Faz 5'te eklenecek)
- "Zimmet Eden" satırında kullanıcı adı gösterilmez (imza sahasına bırakılır)
- Tüm aktif zimmetler PDF'inde `assignedAt` en eskiden yeniye sıralanır
- Tek zimmet PDF'inde `assignedAt` tarihi başlıkta gösterilir

---

## Tetikleyici Noktalar

### 1. Toplu Zimmet Sonrası (AssetsTableClient + CariClient)

`handleBulkAssign` başarıyla tamamlandığında modal **kapanmaz**; yerine "başarı ekranı" gösterilir:

```
✓ N demirbaş zimmetlendi.

  [PDF İndir]   [Kapat]
```

"PDF İndir" → `GET /api/employees/[employeeId]/assignments/pdf` (yeni sekmede açar)
"Kapat" → modal kapanır, `router.refresh()` çağrılır

### 2. Personel Cari — Aktif Zimmetler Sekmesi

"Toplu Zimmet Et" butonunun yanında "PDF Al" butonu:

```tsx
<a href={`/api/employees/${employee.id}/assignments/pdf`} target="_blank">
  PDF Al
</a>
```

### 3. Personel Cari — Zimmet Geçmişi Sekmesi

Her satırda küçük `FileText` ikonu:

```tsx
<a href={`/api/assets/assignments/${assignment.id}/pdf`} target="_blank">
  <FileText size={14} />
</a>
```

---

## Dosya Haritası

| Durum | Dosya | Sorumluluk |
|-------|-------|-----------|
| **Create** | `src/lib/pdf-templates/zimmet-tutanagi.tsx` | `@react-pdf/renderer` bileşeni |
| **Create** | `src/app/api/employees/[id]/assignments/pdf/route.ts` | Tüm aktif zimmetler PDF |
| **Create** | `src/app/api/assets/assignments/[assignmentId]/pdf/route.ts` | Tek zimmet PDF |
| **Modify** | `src/app/(dashboard)/assets/assets-table-client.tsx` | Başarı ekranı + PDF linki |
| **Modify** | `src/app/(dashboard)/personel/[id]/cari-client.tsx` | PDF butonları |

---

## Mimari Notlar

- PDF bileşeni saf fonksiyon; veri API route tarafından hazırlanır, bileşen sadece render
- `renderToBuffer` ile PDF buffer üretilir, `NextResponse` ile stream edilir
- Türkçe karakter için `@react-pdf/renderer` built-in font (Helvetica) yeterli; özel font gerekmez
- API route'larında auth guard zorunlu (401/403)
- PDF içinde logo alanı rezerve edilir ama render edilmez; sonraki fazda doldurulur

---

## Kapsam Dışı

- Logo/görsel kimlik (Faz 5)
- PDF şablon editörü
- Toplu PDF (birden fazla çalışan için aynı anda)
- İmza dijital doğrulama
