# Proje: ResolveIT

## Ne Yapıyor
IT departmanları için helpdesk + demirbaş yönetim sistemi.
Gelen mailler otomatik ticket'a dönüşür, SLA takibi yapılır, çözüm süreci izlenir;
bilgisayar/yazıcı gibi kurumsal demirbaşlar atama ve servis geçmişiyle yönetilir.

## Tech Stack
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes + Server Actions
- **Veritabanı**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js — credentials tabanlı, 3 rol (ADMIN / IT_STAFF / REQUESTER)
- **AI**: Anthropic SDK — mail içeriğini özetler, öncelik belirler
- **Email**: IMAP (Gmail/Exchange) + Microsoft Graph API (M365)
- **Deploy**: Vercel

## Kritik Kurallar
- API route'larında Zod doğrulama zorunlu.
- DB migration'larını elle yazma — `npm run db:push` kullan.
- `"use client"` direktifi sadece gerçekten etkileşim gerektiren bileşenlerde.
- Environment variable'ları `.env.local` içinde tut, koda gömme.
- Server action'larda auth guard zorunlu — her action `auth()` ile başlar.
- `prisma` client'ı `src/lib/db.ts`'deki singleton'dan import et, direkt new Prisma kullanma.

## Roller ve Erişim
- **ADMIN**: Her şey — kullanıcı yönetimi, SLA config, email ayarları
- **IT_STAFF**: Talepler, demirbaşlar, performans metrikleri
- **REQUESTER**: Sadece kendi talepleri

## SLA Süreleri (Otomatik)
- CRITICAL: 2 saat | HIGH: 8 saat | MEDIUM: 24 saat | LOW: 72 saat

## Proje Yapısı
```
src/
├── app/
│   ├── api/              ← API route'ları (tickets, assets, sla, email, auth, users)
│   ├── (auth)/           ← Login sayfası
│   └── (dashboard)/      ← Ana uygulama (tickets, assets, settings, performance)
├── components/
│   ├── ui/               ← Temel UI bileşenleri (button, card, badge, input...)
│   └── tickets/          ← Ticket'a özel bileşenler
├── lib/
│   ├── actions/          ← Server actions (ticket.actions.ts, asset.actions.ts)
│   ├── db.ts             ← Prisma singleton (en merkezi node — dikkatli değiştir)
│   ├── sla.ts            ← SLA hesaplama ve ihlal tespiti
│   ├── email-parser.ts   ← Anthropic AI ile mail → ticket dönüşümü
│   ├── microsoft-graph.ts ← M365 mail okuma
│   └── utils.ts          ← cn() ve genel yardımcılar
└── types/                ← TypeScript tip tanımları
prisma/
├── schema.prisma         ← DB şeması
└── seed.ts               ← Test verisi (5 kullanıcı, SLA config, örnek talepler)
```

## Çalışma Protokolü
Her yeni talep şu sırayla işlenir:
1. **Brainstorming** — Gereksinim netleştirilir; daha iyi alternatif varsa önce uyarılır
2. **Soru** — Belirsizlik varsa tek tek sorular sorulur, tahmin yapılmaz
3. **Yaklaşımlar** — 2-3 seçenek, trade-off ve öneri sunulur
4. **Onay** — Kullanıcı onaylamadan kod yazılmaz
5. **Plan** — Görev listesi çıkarılır
6. **Uygulama** — Tüm agentlar devreye girer (architect / frontend / backend / security / tester)
7. **Review** — Teslim sonrası review yapılır

## Özel Notlar
- `src/lib/db.ts` — 36 edge ile en merkezi node; değiştirirken dikkatli ol
- `cn()` (`src/lib/utils.ts`) — tüm UI bileşenleri kullanır
- Email entegrasyonu provider bazlı: `IMAP` veya `MICROSOFT_GRAPH` (Settings'den seçilir)
- Spec belgesi: `docs/superpowers/specs/2026-05-24-resolveit-imap-methodology-design.md`

---
@.claude/rules/api.md
@.claude/rules/components.md
