---
name: test
description: Verilen kod için unit test, integration test veya E2E test yazar. Vitest, Jest, Playwright.
user-invocable: true
argument-hint: "[dosya yolu veya fonksiyon adı]"
model: haiku
---

Test yazılacak: $ARGUMENTS

Tester agent'ı çalıştır:

1. Kodu oku ve ne test edilmesi gerektiğini belirle.
2. AAA pattern ile testleri yaz.
3. Happy path + edge case + hata durumlarını kapsa.
4. Mevcut test konfigürasyonuna (vitest.config, jest.config) uy.
5. Test dosyasını oluştur veya mevcut dosyaya ekle.
