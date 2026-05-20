---
paths:
  - "src/api/**"
  - "src/app/api/**"
  - "pages/api/**"
  - "app/api/**"
  - "server/**"
---

# API Dosyaları İçin Kurallar

Bu dosyaları düzenlerken otomatik uygula:

- **Input validation zorunlu**: Tüm request body, query param ve path param'lar Zod ile doğrulanmalı.
- **Auth kontrolü**: Korumalı endpoint'lerde auth middleware çalışıyor mu?
- **Hata mesajı**: İç hata detayları (stack trace, DB mesajı) response'a yazılmamalı.
- **HTTP status**: 200/201/400/401/403/404/422/500 — doğru kod kullan.
- **Rate limiting**: Public endpoint'lerde rate limit var mı?
- **CORS**: `*` yerine izin verilen origin'ler açıkça belirtilmeli.
