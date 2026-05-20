# 🤖 AI Yetenek (Skills) Kullanım Kılavuzu

Bu klasördeki "Skiller", yapay zekanın belirli konularda uzmanlaşmasını sağlayan bilgi ve talimat setleridir. Yapay zeka ile çalışırken **"Şunu tasarla"**, **"Bunu test et"** veya **"Güvenliği kontrol et"** dediğinizde, arka planda bu modüller devreye girer.

Aşağıda, mevcut yeteneklerin ne işe yaradığını ve hangi durumlarda kullanmanız gerektiğini açıklayan kategorize edilmiş bir rehber bulunmaktadır.

---

## 🏗️ 1. Proje Oluşturma ve Planlama
*Yeni bir işe başlarken veya büyük bir değişiklik yaparken kullanılır.*

| Yetenek Adı | Ne İşe Yarar? | Ne Zaman/Nasıl Çağrılır? |
| :--- | :--- | :--- |
| **`app-builder`** | **Ana Müteahhit.** Sıfırdan bir uygulama kurar. Teknolojileri seçer, dosyaları oluşturur. | *"Bana bir e-ticaret sitesi kur"*, *"/create komutu"* |
| **`architecture`** | **Mimari Kararlar.** Projenin temel yapısını, klasör düzenini ve teknoloji seçimlerini analiz eder. | *"Bu proje için en uygun mimari nedir?"*, *"Monolith mi Microservice mi?"* |
| **`plan-writing`** | **Görev Listesi.** Karmaşık işleri adım adım uygulanabilir planlara (task.md) dönüştürür. | *"Bunu nasıl yapacağımızı planlayalım"*, *"/plan komutu"* |
| **`brainstorming`** | **Beyin Fırtınası.** Fikir geliştirme, eksikleri bulma ve soru-cevap seansları yapar. | *"Bu özellik hakkında beyin fırtınası yapalım"*, *"/brainstorm"* |

---

## 🎨 2. Frontend ve Tasarım (Arayüz)
*Web sitesi veya mobil uygulama ekranlarıyla çalışırken kullanılır.*

| Yetenek Adı | Ne İşe Yarar? | Ne Zaman/Nasıl Çağrılır? |
| :--- | :--- | :--- |
| **`frontend-design`** | **Web Tasarımı.** Renkler, tipografi, UX (Kullanıcı Deneyimi) ve modern web arayüzleri tasarlar. | *"Ana sayfayı daha modern tasarla"*, *"Renk paletini değiştir"* |
| **`mobile-design`** | **Mobil Tasarım.** iOS/Android için dokunmatik uyumlu arayüzler ve navigasyon tasarlar. | *"Mobil görünümü düzelt"*, *"React Native ekranı tasarla"* |
| **`react-patterns`** | **React Uzmanlığı.** React bileşenleri (hook'lar, state yönetimi) için en iyi pratikleri uygular. | *"Bu componenti React best practice'lerine göre refactor et"* |
| **`tailwind-patterns`** | **CSS Stilleri.** Tailwind CSS kullanarak hızlı ve şık stillendirme yapar. | *"Tailwind ile responsive hale getir"*, *"Stilleri düzelt"* |
| **`nextjs-best-practices`**| **Next.js Uzmanlığı.** App Router, Server Components ve SEO uyumlu Next.js kodları yazar. | *"Next.js 14 yapısına uygun mu?"*, *"Server component kullan"* |

---

## ⚙️ 3. Backend ve Veri (Arka Plan)
*Sunucu, veritabanı ve API işlemleri için kullanılır.*

| Yetenek Adı | Ne İşe Yarar? | Ne Zaman/Nasıl Çağrılır? |
| :--- | :--- | :--- |
| **`api-patterns`** | **API Tasarımı.** REST veya GraphQL uç noktalarının nasıl olması gerektiğini belirler. | *"Yeni bir kullanıcı API'si yazalım"*, *"API yanıtlarını düzenle"* |
| **`database-design`** | **Veritabanı.** Tablo yapıları (Schema), SQL sorguları ve veri ilişkilerini tasarlar. | *"Veritabanı şemasını oluştur"*, *"Bu sorguyu optimize et"* |
| **`nodejs-best-practices`**| **Node.js Uzmanlığı.** Backend kodlarının performanslı ve güvenli olmasını sağlar. | *"Node.js sunucusu kur"*, *"Express route'larını düzenle"* |
| **`python-patterns`** | **Python Uzmanlığı.** Python, Django veya FastAPI projeleri için standartları belirler. | *"Python scriptini optimize et"*, *"FastAPI ile endpoint yaz"* |

---

## 🧪 4. Test ve Kalite Kontrol
*Kodun sağlamlığını ve düzgün çalıştığını doğrulamak için kullanılır.*

| Yetenek Adı | Ne İşe Yarar? | Ne Zaman/Nasıl Çağrılır? |
| :--- | :--- | :--- |
| **`webapp-testing`** | **Tarayıcı Testi.** Uygulamayı bir kullanıcı gibi tarayıcıda açıp tıklar ve test eder (E2E). | *"Uygulamanın giriş sayfasını test et"*, *"Butonlar çalışıyor mu kontrol et"* |
| **`testing-patterns`** | **Birim Testleri.** Kodun küçük parçalarının (fonksiyonların) doğru çalıştığını test eder. | *"Bu fonksiyon için test yaz"*, *"Unit testleri ekle"* |
| **`tdd-workflow`** | **TDD Akışı.** Önce testi yazıp sonra kodu geliştirme disiplinini uygular. | *"TDD yöntemini kullanarak bu özelliği geliştirelim"* |
| **`clean-code`** | **Temiz Kod.** Kodun okunabilir, basit ve bakımı kolay olmasını sağlar (Refactoring). | *"Kodu temizle ve sadeleştir"*, *"Refactor et"* |
| **`lint-and-validate`** | **Hata Denetimi.** Yazım yanlışlarını, linter hatalarını ve stil bozukluklarını düzeltir. | *"Kodda hata var mı kontrol et"*, *"Lint hatalarını çöz"* |
| **`systematic-debugging`**| **Hata Ayıklama.** Karmaşık hataların kök nedenini adım adım analiz ederek bulur. | *"/debug"*, *"Bu hata neden oluyor, detaylı incele"* |

---

## 🛡️ 5. Güvenlik ve Performans
*Uygulamanın güvenli ve hızlı olması için kullanılır.*

| Yetenek Adı | Ne İşe Yarar? | Ne Zaman/Nasıl Çağrılır? |
| :--- | :--- | :--- |
| **`vulnerability-scanner`**| **Güvenlik Taraması.** Kodlardaki güvenlik açıklarını (SQL Injection, XSS vb.) arar. | *"Güvenlik açığı var mı?"*, *"Kodu güvenlik açısından incele"* |
| **`performance-profiling`** | **Hız Analizi.** Uygulamanın neden yavaş çalıştığını bulur ve hızlandırır. | *"Sayfa çok yavaş açılıyor"*, *"Performans analizi yap"* |
| **`seo-fundamentals`** | **SEO.** Sitenin Google'da üst sıralarda çıkması için gerekli ayarları yapar. | *"SEO ayarlarını yap"*, *"Meta etiketlerini kontrol et"* |

---

## 🚀 6. DevOps ve Sistem
*Uygulamayı canlıya alma ve sunucu yönetimi.*

| Yetenek Adı | Ne İşe Yarar? | Ne Zaman/Nasıl Çağrılır? |
| :--- | :--- | :--- |
| **`deployment-procedures`**| **Yayınlama.** Uygulamanın sunucuya (Vercel, AWS, VPS) nasıl yükleneceğini yönetir. | *"/deploy"*, *"Canlıya alma prosedürünü başlat"* |
| **`server-management`** | **Sunucu Yönetimi.** Linux sunucu ayarları, Docker ve Nginx yapılandırmaları. | *"Sunucu ayarlarını kontrol et"*, *"Docker dosyası oluştur"* |
| **`bash-linux`** / **`powershell`** | **Terminal.** Komut satırı işlemlerini doğru ve güvenli şekilde yapar. | *"Terminalde şu komutu çalıştır"* |

---

## 💡 Nasıl Kullanırım?

Bu yetenekleri (skill) doğrudan "Şu skilli kullan" diyerek çağırmanıza gerek yoktur (ancak isterseniz diyebilirsiniz). Yapay zeka, **niyetinizi anlayarak** doğru yeteneği otomatik olarak seçer.

**Örnek Senaryolar:**

*   **Sen:** *"Kullanıcı giriş sayfasında bir hata var, butona basınca hiçbir şey olmuyor."*
    *   **AI:** Otomatik olarak **`systematic-debugging`** ve **`react-patterns`** yeteneklerini kullanır.
*   **Sen:** *"Bu sayfayı test etmek istiyorum."*
    *   **AI:** **`webapp-testing`** (tarayıcı testi için) veya **`testing-patterns`** (kod testi için) yeteneklerine başvurur.
*   **Sen:** *"Veritabanına yeni bir tablo ekleyip API'sini yazalım."*
    *   **AI:** **`database-design`** ve **`api-patterns`** yeteneklerini birleştirir.
