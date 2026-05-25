# Faz 2: Personel/Cari Modeli — Tasarım Dokümanı

**Tarih:** 2026-05-25
**Durum:** Onaylı

---

## Amaç

36 firmadan oluşan holding yapısında, sistem hesabı olmayan şirket çalışanlarını kayıt altına almak; demirbaşları bu çalışanlara zimmetlemek ve her çalışan için kapsamlı bir "cari" görünümü sunmak.

---

## Kapsam

**Dahil:**
- `Employee` modeli (sistem hesabından bağımsız çalışan kaydı)
- `AssetAssignment.userId` → `employeeId` migrasyonu
- Personel CRUD (Settings değil, ana nav — `/personel`)
- Çalışan cari sayfası (`/personel/[id]`) — aktif zimmetler, zimmet geçmişi, servis geçmişi, ilgili talepler
- Asset sayfasında zimmet akışı güncelleme (firma → çalışan seçimi)
- Sidebar'a Personel linki

**Dışarıda (sonraki fazlar):**
- Toplu zimmet (Faz 3)
- Çalışan bazlı PDF raporu (Faz 5)
- Zimmet mail bildirimi (Faz 7)

---

## Veri Modeli

### Employee

```prisma
model Employee {
  id           String   @id @default(cuid())
  firstName    String
  lastName     String
  email        String
  phone        String?
  department   String?
  title        String?
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id], onDelete: Restrict)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  assignments  AssetAssignment[]

  @@unique([email, companyId])
  @@index([companyId])
  @@index([isActive])
}
```

**Kural:** `onDelete: Restrict` — çalışanı olan firma silinemez. Önce çalışanlar pasife alınmalı.

**Kural:** `@@unique([email, companyId])` — aynı firmada e-posta tekrarı engellenir; farklı firmalarda aynı e-posta olabilir.

### AssetAssignment — Değişiklik

`userId String` → `employeeId String` (temiz swap):

```prisma
model AssetAssignment {
  id           String    @id @default(cuid())
  assetId      String
  employeeId   String
  employee     Employee  @relation(fields: [employeeId], references: [id], onDelete: Restrict)
  assignedAt   DateTime  @default(now())
  returnedAt   DateTime?
  notes        String?
  isActive     Boolean   @default(true)

  asset   Asset   @relation(fields: [assetId], references: [id], onDelete: Cascade)
}
```

**Migration notu:** Gerçek zimmet kaydı olmadığından `db push --accept-data-loss` ile temiz geçiş yapılır.

### Company — Değişiklik

`employees Employee[]` ilişkisi eklenir.

### Ticket — Değişiklik Yok

Cari sayfasında ticket'lar `ticket.emailFrom == employee.email` eşleştirmesiyle query-time gösterilir; yeni FK gerekmez.

---

## API Route'ları

| Method | Route | Yetki | Açıklama |
|--------|-------|-------|----------|
| GET | `/api/employees` | ADMIN, IT_STAFF | Liste (`companyId` query param opsiyonel) |
| POST | `/api/employees` | ADMIN, IT_STAFF | Yeni çalışan oluştur |
| PATCH | `/api/employees/[id]` | ADMIN, IT_STAFF | Güncelle |
| DELETE | `/api/employees/[id]` | ADMIN | Pasife al (soft delete — `isActive: false`) |

**Not:** DELETE fiziksel silme yapmaz; `isActive: false` yapar. Aktif zimmeti olan çalışan pasife alınamaz (API 409 döner).

---

## UI Sayfaları

### `/personel` — Personel Listesi

- Ana navigasyonda **Demirbaşlar'ın hemen altında**
- ADMIN ve IT_STAFF görür, REQUESTER görmez
- Firma dropdown filtresi (tüm firmalar / firma seç)
- Her satır: ad soyad, unvan, departman, firma badge (shortCode), aktif zimmet sayısı, durum badge
- Ekleme butonu → modal
- Satır tıklaması → `/personel/[id]` cari sayfası
- Satır aksiyonları: düzenle (modal), pasife al (onay)

**Modal alanları:** Ad, Soyad, E-posta, Telefon, Departman, Unvan, Firma (dropdown, zorunlu), Aktif checkbox

### `/personel/[id]` — Çalışan Cari Sayfası

Server component. `Promise.all` ile paralel sorgular.

**Üst kart:**
- Ad Soyad, Unvan
- Firma badge (shortCode + name)
- E-posta, Telefon, Departman
- Durum badge (Aktif/Pasif)
- Düzenle butonu

**Sekme 1 — Aktif Zimmetler:**
- `AssetAssignment` where `employeeId = id AND isActive = true`
- Her satır: demirbaş kodu, ad, kategori, zimmet tarihi, notlar
- "İade Et" butonu her satırda

**Sekme 2 — Zimmet Geçmişi:**
- Tüm `AssetAssignment` kayıtları (aktif + pasif)
- Sütunlar: demirbaş, zimmet tarihi, iade tarihi, süre, notlar

**Sekme 3 — Servis Geçmişi:**
- Bu çalışana zimmetli demirbaşların servis kayıtları
- Query: `AssetService` join `Asset` join `AssetAssignment` where `employeeId = id`
- Tarih filtresi: servis başlangıcı zimmet dönemine denk geliyorsa listele
- Sütunlar: demirbaş, servis türü, başlangıç, bitiş, maliyet, tedarikçi

**Sekme 4 — İlgili Talepler:**
- `Ticket` where `emailFrom ILIKE '%employee.email%'`
- Sütunlar: talep no, başlık, durum, öncelik, tarih

---

## Asset Sayfası — Zimmet Akışı Güncelleme

Mevcut "Zimmet Et" modalında `User` picker → **firma seç → o firmaya ait aktif çalışanlar** dropdown:

```
1. Firma: [ABC Holding ▼]
2. Çalışan: [Ali Veli — Muhasebe ▼]
3. Notlar: [...]
[Zimmet Et]
```

`assignAsset(assetId, employeeId, notes?)` server action imzası güncellenir.

---

## Sidebar Değişikliği

`src/components/sidebar.tsx` ana navigasyona `Personel` eklenir:

```typescript
{ href: "/personel", label: "Personel", icon: Users2, roles: ["ADMIN", "IT_STAFF"] }
```

Demirbaşlar linkinin hemen altına yerleştirilir.

---

## Mimari Notlar

- `/personel` ve `/personel/[id]` server component — veri DB'den sunucuda çekilir
- `companies-client.tsx` pattern'ı takip edilir: server page + client interactive component
- Cari sayfası sekmeli yapı için `useState` ile aktif sekme yönetimi (client component)
- `assignAsset` server action'ı `lib/actions/asset.actions.ts`'te güncellenir

---

## Kapsam Dışı

- Toplu zimmet (birden fazla demirbaş aynı anda) → Faz 3
- Çalışan bazlı PDF raporu → Faz 5
- Zimmet bildirimi (e-posta) → Faz 7
- Çalışana sistem hesabı bağlama → Gelecek faz
