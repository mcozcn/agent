---
paths:
  - "src/components/**"
  - "components/**"
  - "app/**/*.tsx"
  - "src/app/**/*.tsx"
---

# React Component Dosyaları İçin Kurallar

Bu dosyaları düzenlerken otomatik uygula:

- **Server Component varsayılan**: `"use client"` sadece useState, useEffect, event handler veya browser API gerektiğinde.
- **Props tipi zorunlu**: Inline interface veya ayrı type — prop'lar tiplanmadan bileşen yazma.
- **Loading state**: Async bileşenlerde Suspense veya skeleton göster.
- **Error state**: Kritik bileşenlerde hata durumu ele alınmalı.
- **Erişilebilirlik**: Semantic HTML kullan. Button için `<button>`, link için `<a>`.
- **`any` yasak**: TypeScript strict mod — bilinmeyen tipler için `unknown`.
