# 🎓 Öğrenciler İçin Her Şey - Eğitim Asistanı

Bu proje, öğrencilerin sınav hazırlık süreçlerini desteklemek, yapay zeka destekli soru üretmek, deneme analizi yapmak ve rehberlik hizmeti sunmak amacıyla geliştirilmiştir. Modern web teknolojileri kullanılarak hazırlanmış, Vercel üzerinde çalışan, hızlı ve güvenli bir uygulamadır.

## 🚀 Özellikler

- **AI Soru Üretimi:** Seçtiğiniz ders, konu ve süreye göre kişiye özel testler hazırlar. (Powered by Gemini AI)
- **Sınav Simülasyonu:** Gerçek sınav süresi ve formatında deneme çözme imkanı.
- **Yapay Zeka Sohbeti:** Eğitim koçu ile (AI) dilediğiniz zaman sohbet edin, rehberlik alın.
- **Deneme Analizi:** Yüklediğiniz deneme sonuçlarını analiz eder, eksiklerinizi belirler.
- **Kişisel Takip:** Çalışma saatlerinizi, hedeflediğiniz üniversite ve bölümleri kaydedin.

## 🛠️ Teknolojiler

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express (Vercel Serverless Functions)
- **Veritabanı:** Supabase (PostgreSQL)
- **Yapay Zeka:** Google Gemini API (gemini-2.5-flash)
- **Routing:** React Router DOM
- **Deployment:** Vercel

## 📦 Kurulum (Yerel Geliştirme)

Projeyi kendi bilgisayarınızda çalıştırmak için:

1.  Repoyu klonlayın:
    ```bash
    git clone https://github.com/yasinkuzey/ogrenciler-icin-hersey.git
    cd ogrenciler-icin-hersey
    ```

2.  Bağımlılıkları yükleyin:
    ```bash
    npm install
    ```

3.  `.env` dosyasını oluşturun ve gerekli anahtarları ekleyin:
    ```env
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY
    GEMINI_API_KEY=YOUR_GOOGLE_AI_KEY
    ```

4.  Projeyi başlatın:
    ```bash
    npm run dev
    ```

## 🌐 Canlı Sürüm

Proje şu adreste yayındadır: [https://oegrenci-icin-sistem.vercel.app](https://oegrenci-icin-sistem.vercel.app)

## 🤝 Katkıda Bulunma

1.  Bu projeyi forklayın.
2.  Yeni bir özellik dalı (branch) oluşturun (`git checkout -b yeni-ozellik`).
3.  Değişikliklerinizi yapın ve commitleyin (`git commit -m 'Yeni özellik eklendi'`).
4.  Dalınızı (branch) gönderin (`git push origin yeni-ozellik`).
5.  Bir Pull Request oluşturun.

## 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.
