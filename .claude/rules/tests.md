---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "**/__tests__/**"
  - "e2e/**"
  - "tests/**"
---

# Test Dosyaları İçin Kurallar

Bu dosyaları düzenlerken otomatik uygula:

- **AAA pattern**: Arrange → Act → Assert — her test bu yapıda olmalı.
- **Test adı**: "ne yapmalı" formatında — `it('kullanıcı email ile giriş yapabilmeli')`.
- **Davranış test et**: Implementation detayını değil, gözlemlenebilir davranışı test et.
- **Üretim kodu yazma**: Test dosyasında iş mantığı bulunmamalı.
- **İzolasyon**: Her test bağımsız çalışmalı — sıra bağımlılığı olmamalı.
- **Mock temizliği**: `afterEach` veya `afterAll`'da mock'ları temizle.
