# Proje: [İsim Buraya]

## Ne Yapıyor
[1-2 cümle — ne inşa ediliyor]

## Tech Stack
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend**: [Hono / Express / FastAPI]
- **Veritabanı**: [PostgreSQL / SQLite] + [Drizzle / Prisma]
- **Auth**: [Better-Auth / NextAuth / Clerk]
- **Deploy**: [Vercel / Railway / VPS]

## Kritik Kurallar
- API route'larında Zod doğrulama zorunlu.
- DB migration'larını elle yazma — ORM CLI kullan.
- `"use client"` direktifi sadece gerçekten etkileşim gerektiren bileşenlerde.
- Environment variable'ları `.env.local` içinde tut, koda gömme.

## Proje Yapısı
```
src/
├── app/          ← Next.js App Router sayfaları
├── components/   ← Paylaşılan UI bileşenleri
├── lib/          ← Utility fonksiyonlar, DB client
├── server/       ← Server actions, API logic
└── types/        ← TypeScript tip tanımları
```

## Özel Notlar
[Projeye özel dikkat edilmesi gereken şeyler buraya]

---
@.claude/rules/api.md
@.claude/rules/components.md
