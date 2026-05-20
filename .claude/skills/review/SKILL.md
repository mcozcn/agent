---
name: review
description: Kod kalitesi, güvenlik, performans ve best practice incelemesi. Dosya, klasör veya son değişiklikler için.
user-invocable: true
argument-hint: "[dosya yolu veya 'son değişiklikler']"
model: sonnet
---

İncelenecek: $ARGUMENTS

## İnceleme Kriterleri

Kodu şu açılardan incele:

**1. Güvenlik**
- Hardcoded secret var mı?
- Input validation yapılıyor mu?
- Auth kontrolü eksik mi?
- XSS, injection riski?

**2. Performans**
- N+1 sorgu var mı?
- Gereksiz re-render var mı?
- Büyük bundle'a yol açacak import var mı?
- Senkron işlem async olmalı mı?

**3. Doğruluk**
- Edge case'ler düşünülmüş mü?
- Hata durumları ele alınmış mı?
- TypeScript `any` var mı?

**4. Sürdürülebilirlik**
- Tekrar eden kod var mı? (DRY)
- Fonksiyon çok büyük mü? (> 50 satır)
- İsimler açıklayıcı mı?

## Çıktı Formatı

```
| Öncelik | Konum | Sorun | Öneri |
|---------|-------|-------|-------|
| 🔴 Critical | dosya:satır | açıklama | düzeltme |
| 🟠 High | ... | ... | ... |
| 🟡 Medium | ... | ... | ... |
| 🟢 Low | ... | ... | ... |
```

Sorun yoksa: "İncelenen kodda önemli bir sorun bulunamadı. [hangi kontrolleri yaptığını yaz]"

Düzeltme önerisi olmadan bulgu bildirme.
