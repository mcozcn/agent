---
name: secure
description: Güvenlik taraması ve denetimi. Projeyi veya belirli dosyaları OWASP top 10'a göre inceler.
user-invocable: true
argument-hint: "[dosya yolu veya boş bırak=tüm proje]"
model: opus
---

Taranacak: $ARGUMENTS

Security agent'ı çalıştır ve OWASP Top 10 kontrolü yap:

1. Injection riskleri (SQL, NoSQL, Command)
2. Auth/authz eksiklikleri
3. Hardcoded secrets
4. XSS riskleri
5. Güvensiz konfigürasyon (CORS, headers)
6. Hassas veri ifşası

Her bulgu için: Konum + Açıklama + Exploit senaryosu + Düzeltme kodu.
