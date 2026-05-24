# ResolveIT — IMAP Email Entegrasyonu & Çalışma Metodolojisi

**Tarih:** 2026-05-24
**Durum:** Onaylandı

---

## Proje Özeti

ResolveIT; IT departmanlarının destek taleplerini ve demirbaşlarını yönettiği
bir helpdesk + asset management sistemidir. Codebase büyük ölçüde hazır;
bu spec iki eksikliği kapatır:

1. **IMAP email entegrasyonu** — mevcut M365-only yapıyı Gmail (ve genel IMAP) desteğiyle genişletir
2. **Çalışma metodolojisi** — her talebin superpowers süreci üzerinden geçmesini sağlar

---

## Mevcut Durum

| Bileşen | Durum |
|---------|-------|
| Ticket CRUD + akış (OPEN→RESOLVED/UNRESOLVED) | ✅ Hazır |
| SLA otomatik hesaplama ve ihlal tespiti | ✅ Hazır |
| Demirbaş yönetimi (atama, servis, hurdaya çıkarma) | ✅ Hazır |
| Rol bazlı erişim (ADMIN / IT_STAFF / REQUESTER) | ✅ Hazır |
| AI ile mail → ticket dönüşümü (`parseEmailToTicket`) | ✅ Hazır |
| Microsoft Graph API entegrasyonu | ✅ Hazır |
| **IMAP / Gmail desteği** | ❌ Eksik |
| Sistem kurulumu (DB, env, seed) | ⏳ Yapılmadı |

---

## Karar: IMAP Yaklaşımı

**Seçilen:** IMAP (imapflow paketi)
**Neden:** Gmail app password ile kurulumu 2 dakika; aynı kod Exchange/M365 IMAP'ı da destekler;
Google Cloud projesi gerekmez; IT helpdesk için 5 dakikalık polling yeterli.

**M365 geçiş yolu:** Settings'den provider `MICROSOFT_GRAPH` seçilir, Graph API kodu aktive olur.
IMAP kodu silinmez — şirket içi/IMAP destekli başka mailbox'lar için kalır.

---

## Mimari

```
Gelen mail (Gmail IMAP)
  → imap-client.ts: SSL bağlantı, okunmamış mailleri çek
  → email-sync.ts: provider kontrolü (IMAP | MICROSOFT_GRAPH)
  → email-parser.ts: Anthropic AI ile özetle, öncelik belirle (MEVCUT)
  → ticket.actions.ts: Ticket oluştur, SLA deadline ata (MEVCUT)
  → Mail "okundu" işaretle
  → IT ekibi dashboard'da görür
```

---

## Database Değişikliği

`EmailConfig` modeline yeni alanlar:

```prisma
model EmailConfig {
  // Mevcut alanlar (kalır)
  id           String    @id @default(cuid())
  isActive     Boolean   @default(false)
  tenantId     String?
  clientId     String?
  clientSecret String?
  mailbox      String?
  lastSyncAt   DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // YENİ alanlar
  provider     String    @default("MICROSOFT_GRAPH") // "IMAP" | "MICROSOFT_GRAPH"
  imapHost     String?   // imap.gmail.com
  imapPort     Int?      // 993
  imapUser     String?   // it@firma.com
  imapPassword String?   // Gmail app password (16 hane)
}
```

---

## Etkilenen Dosyalar

| Dosya | Değişiklik |
|-------|-----------|
| `prisma/schema.prisma` | EmailConfig'e provider + IMAP alanları |
| `src/lib/imap-client.ts` | YENİ — IMAP bağlantısı, mail okuma |
| `src/lib/email-sync.ts` | YENİ — Provider bazlı sync orkestrasyonu |
| `src/app/api/email/sync/route.ts` | IMAP provider'ı destekle |
| `src/app/api/email/config/route.ts` | Yeni alanları al/kaydet, Zod validasyon ekle |
| `src/app/(dashboard)/settings/email/page.tsx` | Provider seçimi + IMAP form alanları |

---

## Gmail Kurulum Adımları (Kullanıcı için)

```
1. Google Hesap → Güvenlik → 2 Adımlı Doğrulama (açık olmalı)
2. Google Hesap → Güvenlik → Uygulama Şifreleri
3. Uygulama: "Mail" → Cihaz: "Diğer" → Ad: "ResolveIT"
4. Oluşan 16 haneli şifreyi kopyala
5. ResolveIT → Ayarlar → E-posta Entegrasyonu:
   - Provider: IMAP
   - Host: imap.gmail.com
   - Port: 993
   - Kullanıcı: gmail-adresin@gmail.com
   - Şifre: 16 haneli app password
```

---

## Polling Stratejisi

- **Şimdilik:** Manuel sync butonu (mevcut "Mailleri Senkronize Et")
- **İlerleyen aşamada (kararlaştırıldığında):** Otomatik polling her 5 dakika

---

## Kapsam Dışı (Bu Spec)

- Otomatik polling / cron job
- Mail yanıt gönderme (ticket kapatıldığında bildirim)
- Google OAuth entegrasyonu
- Microsoft Graph'ın takvim/Teams özellikleri

---

## Çalışma Protokolü

Her yeni talep şu sırayla işlenir:

1. **Brainstorming** — Gereksinim netleştirilir, daha iyi alternatif varsa uyarılır
2. **Soru** — Gereksinim belirsizse tek tek sorular sorulur, tahmin yapılmaz
3. **Yaklaşımlar** — 2-3 seçenek + trade-off + öneri sunulur
4. **Onay** — Kullanıcı onaylamadan kod yazılmaz
5. **Plan** — writing-plans skill ile görev listesi çıkarılır
6. **Uygulama** — Tüm agentlar devreye girer (architect / frontend / backend / security / tester)
7. **Review** — Kod tesliminden sonra review yapılır

---

## Başarı Kriterleri

- [ ] Sistem lokal ortamda ayağa kalkar (DB + seed + dev server)
- [ ] Gmail'den gelen mail otomatik ticket açar
- [ ] Ticket'ta AI özeti ve öncelik görünür
- [ ] SLA deadline otomatik atanır
- [ ] Settings'den IMAP → MICROSOFT_GRAPH geçişi yapılabilir
