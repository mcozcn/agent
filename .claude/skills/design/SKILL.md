---
name: design
description: UI/UX tasarım kararları, component tasarımı, renk/tipografi sistemi ve layout planlaması. Kod yazmadan önce tasarım kararlarını netleştirir.
user-invocable: true
argument-hint: "[ne tasarlanacak]"
model: sonnet
---

Tasarlanacak: $ARGUMENTS

## Tasarım Karar Süreci

### Adım 1: Bağlamı Anla
Önce şunları belirle:
- Sektör nedir? (fintech, sağlık, e-ticaret, SaaS?)
- Hedef kitle? (B2B profesyonel, tüketici, Gen-Z?)
- Mevcut proje stili var mı? (renk, font, spacing mevcut mu?)
- Hangi duyguyu uyandırmalı? (güven, enerji, sadelik, lüks?)

### Adım 2: Tasarım Kararı

Mevcut proje stili varsa ona uy.
Yoksa kullanıcıya sor veya bağlama göre öner:

```
🎨 Tasarım Kararı

Geometri: [Keskin/Yuvarlatılmış/Organik — neden]
Renk paleti: [Ana renk + gerekçe — psikoloji temelli]
Tipografi: [Font seçimi + neden]
Spacing: [8px grid sistemi]
Animasyon: [Var/Yok/Minimal — neden]
```

### Adım 3: Component Planı

```
Sayfanın bölümleri:
1. [Bölüm adı] → [Amaç] → [Temel elementler]
2. ...

Gerekli componentler:
- [Component] → [Props taslağı]
- ...
```

### Adım 4: Onay Al

Tasarım kararını sun. Kod yazmaya **onay sonrası** geç.

## Tasarım Kuralları

- Mevcut projenin stil sistemine uy — "üzerine yaz" değil "entegre et".
- Renk psikolojisi: Mavi=güven, Kırmızı=aciliyet, Yeşil=büyüme, Siyah=lüks.
- Animasyon için sadece `transform` ve `opacity`.
- Erişilebilirlik: 4.5:1 kontrast oranı, 44px minimum touch target.
- `prefers-reduced-motion` desteği zorunlu.
