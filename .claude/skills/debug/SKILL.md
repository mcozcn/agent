---
name: debug
description: Sistematik hata ayıklama. Hata mesajı, stack trace veya davranış açıklamasıyla başla.
user-invocable: true
argument-hint: "[hata mesajı veya sorun açıklaması]"
model: opus
---

Sorun: $ARGUMENTS

## Debug Protokolü

### Adım 1: Bilgi Topla
Yeterli bilgi yoksa önce sor:
- Hata mesajının tam metni nedir?
- Ne zaman oluyor? (her zaman mı, belirli durumda mı?)
- Son değişiklik neydi?
- Dev mi, prod mu?

### Adım 2: Delil İnce
```
1. Hata mesajı → Stack trace → İlgili kod
2. git log --oneline -10 (son değişiklikler)
3. İlgili dosyaları oku
```

### Adım 3: En Olası Nedenler

Sıraya göre kontrol et:
1. Null/undefined erişimi → type guard eksik
2. Async/await yanlış kullanımı → promise resolve edilmemiş
3. Import yolu yanlış → modül bulunamıyor
4. Environment variable eksik → undefined değer
5. Race condition → timing sorunu

### Adım 4: İzole Et

En küçük test case'i bul:
- Hangi input ile hata oluyor, hangi input ile olmuyor?
- Hangi dosya/fonksiyon kesinlikle sorunlu?

### Adım 5: Düzelt ve Doğrula

Düzeltmeyi yap, aynı senaryoyu test et.
Yan etki kontrolü: ilgili başka yerler etkilendi mi?
