---
description: Orkestra Şefi (Maestro) - Karmaşık görevleri analiz eder, uygun yetenekleri seçer ve yönetir.
---

# 🎼 Maestro - Akıllı Orkestrasyon Sistemi

Bu workflow, kullanıcıdan gelen karmaşık istekleri ("Bana bir X kur", "Projeyi test et ve yayınla" vb.) analiz eder ve mevcut yetenekleri (skills) bir orkestra şefi gibi yöneterek en verimli çalışma planını oluşturur.

## 1. Analiz ve Planlama (Analysis & Planning)

Kullanıcının isteğini derinlemesine analiz et ve aşağıdaki adımları izle:

1.  **İstek Analizi:** Kullanıcının temel amacı nedir? (Örn: E-ticaret sitesi kurmak, Hata ayıklamak, Performans iyileştirmek)
2.  **Yetenek Eşleşmesi (Skill Mapping):** Bu amaç için hangi skill'ler gereklidir?
    *   *Yeni Proje:* `app-builder` -> `frontend-design` -> `database-design`
    *   *Mevcut Proje Geliştirme:* `architecture` -> `api-patterns` -> `react-patterns`
    *   *Test ve Yayın:* `webapp-testing` -> `vulnerability-scanner` -> `ci-cd-pipeline` -> `deployment-procedures`
3.  **Sıralama (Sequencing):** Yetenekler hangi sırayla çalışmalı? Bağımlılıklar neler?

## 2. Maestro Planı Oluşturma

Aşağıdaki formatta bir **Maestro Planı** hazırla ve kullanıcıya sun:

```markdown
# 🎼 Maestro Planı: [Proje Adı]

## 🎯 Hedef
[Kullanıcının isteğinin özeti]

## 🎻 Orkestra Ekibi (Seçilen Yetenekler)
1. **[Skill Adı]**: [Neden seçildi ve ne yapacak?]
2. **[Skill Adı]**: [Neden seçildi ve ne yapacak?]
...

## 🎼 İcra Planı (Adım Adım)
1. **[Aşama 1]:** [Skill] ile yapı kurulacak.
2. **[Aşama 2]:** [Skill] ile tasarım yapılacak.
3. **[Aşama 3]:** [Skill] ile testler koşulacak.
...

## 🚀 Başlangıç
Planı onaylıyorsanız **"Başla"** komutunu verin.
```

## 3. İcra (Execution)

Kullanıcı onay verdikten sonra:

1.  Belirlenen sırayla skill'lerin `SKILL.md` dosyalarını oku ve kurallarını uygula.
2.  Her aşamada `task_boundary` ile durumu güncelle.
3.  Bir aşama bitmeden diğerine geçme.
4.  Sorun çıkarsa `systematic-debugging` skill'ini devreye sok.
5.  Tüm süreç bittiğinde `deployment-procedures` veya `ci-cd-pipeline` ile finali yap.

## 4. Final

Proje tamamlandığında:
1.  **Özet Rapor:** Neler yapıldı?
2.  **Test Sonuçları:** Testler geçti mi?
3.  **Kullanım Kılavuzu:** Nasıl çalıştırılır?
