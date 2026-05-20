# Claude Code Uzman Sistemi — Kullanım Kılavuzu

Bu repo, Claude Code'u her projede tutarlı ve verimli kullanmak için hazırlanmış agent + skill şablonudur.

---

## Kurulum (Yeni Projeye Taşıma)

```bash
# 1. Bu repodaki .claude/ klasörünü projeye kopyala
cp -r /path/to/this/repo/.claude/  YeniProje/.claude/

# 2. Boş bir CLAUDE.md oluştur (veya bu repodan kopyala)
touch YeniProje/CLAUDE.md

# 3. Claude Code'u o projede aç ve çalıştır:
/setup
```

`/setup` komutu `package.json`, `pyproject.toml` gibi dosyaları okuyarak tech stack'i otomatik algılar ve sana birkaç soru sorarak `CLAUDE.md`'yi doldurur.

---

## Sistem Neden İki Katmanlı?

```
~/.claude/          ← Global: tüm projelerde çalışır
└── CLAUDE.md       ← Senin iletişim tarzın, genel kod standartların
└── settings.json   ← Model seçimi, izinler
└── agents/
    └── researcher  ← Web araştırması (her projede kullanılır)
└── skills/
    └── setup/      ← /setup komutu (her projede kullanılır)

proje/.claude/      ← Proje-spesifik: sadece bu projede çalışır
└── agents/         ← 8 uzman (frontend, backend, security...)
└── skills/         ← /plan, /review, /debug, /design, /secure, /test
└── rules/          ← Otomatik yüklenen kurallar (api, components, tests)
```

Global sistem bir kez kurulur. Proje sistemi her yeni projede `.claude/` kopyalanarak tekrar kullanılır.

---

## Slash Komutları

Konuşmanın herhangi bir yerinde `/komut` yazarak tetikle.

### `/setup`
Projenin `CLAUDE.md`'sini oluşturur veya günceller.

```
/setup
/setup Kullanıcı yönetim paneli
```

Ne zaman kullan: Yeni projeye `.claude/` kopyaladıktan sonra. Ya da mevcut CLAUDE.md güncel değilse.

---

### `/plan [görev]`
Kodu doğrudan yazmadan önce analiz eder, görev listesi çıkarır ve onay ister.

```
/plan kullanıcı davet sistemi ekle
/plan ödeme akışını Stripe'a taşı
```

Ne zaman kullan: Birden fazla dosyayı etkileyecek, mimari karar gerektiren veya riskli işler için. Tek satır fix için gerek yok.

---

### `/review [dosya veya klasör]`
Güvenlik, performans, kod kalitesi ve best practice incelemesi.

```
/review src/api/users.ts
/review src/components/
/review      ← son değişiklikleri incele (git diff)
```

Ne zaman kullan: PR açmadan önce, yeni yazdığın kodu kontrol ettirmek için.

---

### `/debug [hata mesajı]`
Sistematik kök neden analizi. Rastgele deneme yapmadan hata bulur.

```
/debug TypeError: Cannot read properties of undefined
/debug login sayfası production'da çalışmıyor ama dev'de çalışıyor
```

Ne zaman kullan: Nedenini anlayamadığın hatalar için. Hata mesajını kopyalayıp yapıştır yeterli.

---

### `/design [ne tasarlanacak]`
Kod yazmadan önce UI/UX kararlarını netleştirir. Renk, layout, component planı çıkarır.

```
/design dashboard ana sayfası
/design kullanıcı onboarding akışı
```

Ne zaman kullan: Yeni bir sayfa veya büyük UI değişikliğine başlamadan önce.

---

### `/secure [dosya veya boş]`
OWASP Top 10'a göre güvenlik taraması.

```
/secure src/api/
/secure          ← tüm projeyi tara
```

Ne zaman kullan: Yeni auth sistemi kurduğunda, production'a almadan önce, yeni API endpoint'leri ekleyince.

---

### `/test [dosya veya fonksiyon]`
Verilen kod için unit/integration/E2E test yazar.

```
/test src/lib/pricing.ts
/test checkout akışı için E2E test
```

Ne zaman kullan: Test yazmak istediğinde ya da "bunu nasıl test ederim?" sorusuna cevap ararken.

---

## Uzman Agentlar

Claude çoğu zaman ne yapman gerektiğine bakarak doğru agent'ı kendisi seçer. Ama sen de açıkça belirtebilirsin.

### Otomatik Seçim — Örnekler

| Yazdığın | Claude hangi agent'ı kullanır |
|----------|-------------------------------|
| "Bu komponenti düzelt" | `frontend` |
| "API endpoint'i ekle" | `backend` |
| "Veritabanına kolon ekle" | `database` |
| "Neden crash oluyor?" | `debugger` |
| "Güvenli mi?" | `security` |
| "Nasıl deploy ederiz?" | `devops` |
| "Monolith mi microservice mi?" | `architect` |
| "Bu fonksiyon için test yaz" | `tester` |
| "React Query mi Zustand mı?" | `researcher` |

### Manuel Belirtme

Agent adını mesajında söylersen doğrudan o çalışır:

```
frontend agent: bu kartı yeniden yaz, loading state eksik
security agent: auth middleware'i incele
architect agent: mevcut yapı ölçeklenebilir mi?
```

---

## Otomatik Yüklenen Kurallar

`.claude/rules/` altındaki dosyalar, ilgili dosyaları düzenlerken arka planda otomatik devreye girer. Hiçbir şey yapman gerekmez.

| Hangi dosyayı düzenlersen | Hangi kural yüklenir |
|--------------------------|----------------------|
| `src/api/**`, `app/api/**` | Zod validation, auth kontrolü, HTTP status kodları |
| `src/components/**`, `app/**/*.tsx` | Server component, props tipi, erişilebilirlik |
| `**/*.test.ts`, `e2e/**` | AAA pattern, test izolasyonu |

---

## Model Stratejisi

Her agent için model önceden ayarlandı:

| Model | Hangi agentlar | Neden |
|-------|---------------|-------|
| **Opus** | `debugger`, `security`, `architect` | Derin analiz, hata toleransı düşük |
| **Sonnet** | `frontend`, `backend`, `database`, `devops` | Hız + kalite dengesi |
| **Haiku** | `tester`, `researcher` | Tekrarlı/standart görevler, hızlı |

Global `settings.json`'daki varsayılan model Sonnet. Agent dosyasında belirtilen model bunu override eder.

---

## Sık Sorulan Sorular

**Soru: Agent'ı yanlış seçerse ne yapayım?**
Açıkça belirt: "frontend agent kullan" veya komuta agent adını yaz.

**Soru: `/plan` sonrası "başla" demeden önce bir şeyi değiştirmek istersem?**
Normal konuşma gibi söyle: "T2'yi T1'den önce yap" veya "auth kısmını bu sprint'e alma". Claude planı günceller.

**Soru: Yeni bir proje tipi için özel kurallar eklemek istersem?**
`.claude/rules/` altına yeni bir `.md` dosyası ekle, YAML frontmatter'ına `paths:` yaz. Örnek:

```markdown
---
paths:
  - "prisma/**"
  - "drizzle/**"
---
# Veritabanı dosyaları için kurallar
- Migration'ları elle yazma, CLI kullan.
- Schema değişikliği = migration zorunlu.
```

**Soru: `/setup` sonrası CLAUDE.md'yi manuel düzenleyebilir miyim?**
Evet, her zaman. CLAUDE.md sadece bir markdown dosyası. `/setup` başlangıç noktası sağlar, sen istediğini ekleyip çıkarabilirsin.

**Soru: Global `~/.claude/` ile proje `.claude/` çakışırsa hangisi geçerli?**
İkisi de yüklenir, birbirini tamamlar. Çakışan bir kural varsa proje `.claude/` önceliklidir.

---

## Tipik Bir Geliştirme Akışı

```
1. Yeni özellik isteği geldi
   → /plan kullanıcı bildirim sistemi

2. Plan onaylandı, kodlama başlıyor
   → Claude frontend + backend agent'larını kullanarak yazar

3. Yazılan kodu incele
   → /review src/api/notifications.ts

4. Güvenlik kontrolü
   → /secure src/api/

5. Test ekle
   → /test src/lib/notifications.ts

6. Deploy öncesi
   → /secure (tüm proje)
   → /review (son değişiklikler)
```

---

## Dosya Referansı

```
~/.claude/
├── CLAUDE.md              ← Düzenle: iletişim tarzın, genel tercihler
├── settings.json          ← Düzenle: izin eklemek için
└── agents/
    └── researcher.md      ← Global, her projede çalışır
└── skills/
    └── setup/SKILL.md     ← /setup komutu

proje/.claude/
├── agents/
│   ├── frontend.md        ← Düzenle: projeye özel frontend kuralları
│   ├── backend.md         ← Düzenle: projeye özel backend kuralları
│   ├── database.md
│   ├── security.md
│   ├── debugger.md
│   ├── architect.md
│   ├── tester.md
│   └── devops.md
├── skills/
│   ├── plan/SKILL.md      ← /plan
│   ├── review/SKILL.md    ← /review
│   ├── debug/SKILL.md     ← /debug
│   ├── design/SKILL.md    ← /design
│   ├── secure/SKILL.md    ← /secure
│   └── test/SKILL.md      ← /test
└── rules/
    ├── api.md             ← API dosyaları için otomatik kural
    ├── components.md      ← Component dosyaları için otomatik kural
    └── tests.md           ← Test dosyaları için otomatik kural

proje/CLAUDE.md            ← /setup ile doldur, sonra düzenle
```
