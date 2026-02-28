# Öğrenci Çalışma Platformu

Web uygulaması: çalışma ekleme (AI ile 4 soru), deneme analizi, sınav tahmini, AI öğretmen sohbeti, istatistikler ve liderlik tablosu.

## Gereksinimler

- Node.js 18+
- Supabase hesabı
- Google Gemini API anahtarı

## Kurulum

1. Bağımlılıkları yükle:
   ```bash
   npm install
   ```

2. **Veritabanı (Supabase) – tabloları siz oluşturuyorsunuz:**
   - [supabase.com](https://supabase.com) → Yeni proje oluştur.
   - **Project Settings → API** bölümünden **Project URL** ve **anon public** key’i kopyala (uzun JWT, `eyJ...` ile başlar).
   - **SQL Editor**’e gir → **New query** → `supabase/migrations/001_schema.sql` dosyasının **içeriğini tamamen** yapıştır → **Run**. Tablolar ve kurallar oluşur. Aynı script’i tekrar çalıştırırsanız hata vermez.
   - `.env` içinde `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` bu URL ve key ile doldurulunca uygulama veritabanına bağlanmış olur.

3. Ortam değişkenleri: `.env` dosyası oluştur (`.env.example` kopyala):
   - `VITE_SUPABASE_URL` – Supabase proje URL
   - `VITE_SUPABASE_ANON_KEY` – Supabase anon key
   - `GEMINI_API_KEY` – Google AI Studio'dan API key

4. API sunucusunu (Gemini proxy) ayrı terminalde çalıştır:
   ```bash
   npm run api
   ```
   Varsayılan port: 3001.

5. Frontend’i çalıştır:
   ```bash
   npm run dev
   ```
   Tarayıcıda http://localhost:5173 aç. Vite, `/api` isteklerini 3001’e yönlendirir.

## Supabase şeması

Migration: `supabase/migrations/001_schema.sql`. İçeriği SQL Editor’de çalıştırın; tablolar (profiles, study_sessions, session_questions, exam_analyses, exam_predictions, chat_messages), RLS ve tetikleyiciler oluşur.

## Kullanım

- **Kayıt / Giriş:** E-posta ve şifre ile.
- **Çalışma ekle:** Ders, konu, süre gir → 4 soru (cevabı yazarak) çöz → 3+ doğru yaparsan çalışma ve puan kaydedilir.
- **İstatistikler:** Ana sayfa ve İstatistikler sayfasında özet ve ders dağılımı.
- **Deneme analizi:** TYT/AYT/Ortaokul seç, doğru-yanlış gir → AI analiz.
- **Sınav tahmini:** Sınıf ve müfredat yaz → AI öneri.
- **AI öğretmen:** Sohbet sayfasında soru sor veya konu anlatımı iste.
- **Liderlik:** Her başarılı çalışmada puan kazanılır; tabloda sıralama görünür.
