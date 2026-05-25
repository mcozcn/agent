# Faz 3: Toplu Zimmet — Tasarım Dokümanı

**Tarih:** 2026-05-25
**Durum:** Onaylı

---

## Amaç

Bir çalışana birden fazla demirbaşı tek işlemde zimmetlemeyi mümkün kılmak. İki giriş noktası: personel cari sayfası (çalışan merkezli) ve demirbaş listesi (asset merkezli).

---

## Kapsam

**Dahil:**
- `bulkAssignAssets` server action (atomik transaction)
- Personel cari sayfasında "Toplu Zimmet Et" modal
- Demirbaş listesinde checkbox seçimi + aksiyon barı + zimmet modal
- `AssetsTableClient` — checkbox'lı tablo wrapper bileşeni

**Dışarıda (sonraki fazlar):**
- Toplu iade (Faz 3 sonrası)
- PDF zimmet tutanağı (Faz 4)
- Zimmet e-posta bildirimi (Faz 5)

---

## Veri Modeli — Değişiklik Yok

Mevcut `AssetAssignment` modeli yeterli. Yeni bir server action eklenir; mevcut `assignAsset` tekil zimmet için korunur.

---

## Server Action

`src/lib/actions/asset.actions.ts` dosyasına eklenir:

```typescript
export async function bulkAssignAssets(
  assetIds: string[],
  employeeId: string,
  note?: string
): Promise<void>
```

**İş Kuralları:**
- Sadece `ACTIVE` statüsündeki demirbaşlar işleme alınır; `assetIds` içinde `ACTIVE` olmayan varsa hata fırlatılır
- Tek Prisma `$transaction` içinde:
  1. Her asset için mevcut aktif zimmetleri kapat (`isActive: false`, `returnedAt: now()`)
  2. Yeni `AssetAssignment` kaydı oluştur (`employeeId`, `notes: note`)
  3. Asset status → `ASSIGNED`
- `revalidatePath("/assets")` ve `revalidatePath("/personel/[employeeId]")` çağrılır
- Auth guard: `ADMIN` veya `IT_STAFF` zorunlu

---

## Akış A — Personel Cari Sayfası (`/personel/[id]`)

### Giriş Noktası
`CariClient` bileşeninde "Aktif Zimmetler" sekmesinin sağına "Toplu Zimmet Et" butonu eklenir.

### Modal Adımları
1. **Demirbaş Seçimi:** `GET /api/assets?status=ACTIVE` ile yüklenen demirbaşlar checkbox listesi. Kategori filtresi opsiyonel. En az 1 seçim zorunlu.
2. **Not:** Opsiyonel tek metin alanı — tüm seçili zimmetlere uygulanır.
3. **Onay Ekranı:** "N demirbaş, [Ad Soyad]'a zimmetlenecek" özeti; seçilen demirbaşlar listelenir. "Zimmet Et" ile işlem tamamlanır.

### Veri Akışı
- `CariClient` employee bilgisini zaten biliyor; modal yalnızca asset listesi için API çağrısı yapar
- Onay sonrası `bulkAssignAssets(assetIds, employee.id, note)` çağrılır

---

## Akış B — Demirbaş Listesi (`/assets`)

### Bileşen Yapısı
`assets/page.tsx` server component olarak kalır (filtreler, veri çekme). Tablo kısmı yeni `AssetsTableClient` client bileşenine taşınır.

### Checkbox Seçimi
- Her satırda checkbox; header'da "tümünü seç/kaldır"
- Sadece `ACTIVE` statüsündeki satırlarda checkbox aktif; diğerleri (`IN_SERVICE`, `ASSIGNED`, vb.) seçilemez (disabled)
- Seçim yapılınca sayfanın altında **aksiyon barı** belirir:

```
[N demirbaş seçildi]  [Zimmet Et]  [Seçimi Temizle ✕]
```

### Modal Adımları
1. **Firma Seç:** Aktif firmalar dropdown. Seçilince çalışanlar yüklenir.
2. **Çalışan Seç:** `GET /api/employees?companyId=X&isActive=true` ile yüklenen dropdown.
3. **Not:** Opsiyonel tek metin alanı.
4. **Onay Ekranı:** "N demirbaş, [Ad Soyad]'a zimmetlenecek" özeti; demirbaş listesi gösterilir. "Zimmet Et" ile tamamlanır.

### Veri Akışı
`AssetsTableClient` companies ve assets listesini props olarak alır. Modal içinde employee listesi için API çağrısı yapar. Onay sonrası `bulkAssignAssets` çağrılır.

---

## API Güncellemesi

`GET /api/assets` route'u mevcut değilse oluşturulur; `status` query param ile filtreleme desteklenir (Akış A için `?status=ACTIVE`).

Mevcut `/api/employees` zaten `?companyId=X&isActive=true` destekliyor — ek değişiklik gerekmez.

---

## Dosya Haritası

| Durum | Dosya | Sorumluluk |
|-------|-------|-----------|
| **Modify** | `src/lib/actions/asset.actions.ts` | `bulkAssignAssets` action ekle |
| **Create** | `src/app/api/assets/route.ts` | GET — status filtreli asset listesi (Akış A için) |
| **Modify** | `src/app/(dashboard)/personel/[id]/cari-client.tsx` | Toplu zimmet butonu + modal |
| **Create** | `src/app/(dashboard)/assets/assets-table-client.tsx` | Checkbox'lı tablo, aksiyon barı, zimmet modal |
| **Modify** | `src/app/(dashboard)/assets/page.tsx` | Tablo kısmını AssetsTableClient'a devret; companies prop ekle |

---

## Mimari Notlar

- `bulkAssignAssets` tek transaction — kısmi başarı yok; ya hepsi zimmetlenir ya hiçbiri
- `AssetsTableClient` filtreleme (search, status, category) state'ini tutar; server'dan gelen assets listesi üzerinde client-side filtre uygular — ayrı API çağrısı gerekmez
- Checkbox state ve modal state aynı `AssetsTableClient` bileşeninde; prop drilling yok
- Personel cari modal'ı yalnızca ACTIVE assets'i yükler; zaten assigned olanlar listede çıkmaz

---

## Kapsam Dışı

- Toplu iade
- Farklı çalışanlara aynı anda farklı demirbaşlar atama (her zaten seçim tek çalışana)
- Asset bazlı toplu not (tek not tüm seçime uygulanır)
