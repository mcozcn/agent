---
name: plan
description: Karmaşık bir görevi analiz eder, mevcut kodu okur ve uygulanabilir görev listesi oluşturur. Kod yazmaz.
user-invocable: true
argument-hint: "[ne yapılacak]"
model: opus
effort: high
---

Görev: $ARGUMENTS

## Çalışma Protokolü

### Adım 1: Mevcut Durumu Anla
Önce projeyi oku:
- İlgili dosyaları ve klasör yapısını incele.
- Mevcut pattern'ları ve kısıtları belirle.
- Görevle çakışabilecek bağımlılıkları tespit et.

### Adım 2: Görev Planı Oluştur

Şu formatta çıktı ver:

```
## Plan: [Kısa başlık]

### Kapsam
**Yapılacak:** [ne]
**Yapılmayacak:** [ne dışarıda]

### Görevler
- [ ] T1: [Görev adı] → [Hangi dosya/klasör etkilenir]
- [ ] T2: [Görev adı] → [Hangi dosya/klasör etkilenir]
- [ ] T3: [Görev adı] → [Hangi dosya/klasör etkilenir]

### Bağımlılıklar
T2, T1'den sonra yapılmalı çünkü: [neden]

### Riskler
- [Potansiyel sorun]: [Nasıl ele alınacak]

### İlk Adım
[Tam olarak ne yapılacak, hangi dosya açılacak]
```

### Adım 3: Onay Bekle

Planı sun. **Kullanıcı "başla" veya onay vermeden kod yazma.**
Soru varsa cevapla, sonra tekrar onay al.
