# Duru'nun Atölyesi — Supabase Kurulumu

Bu adımları bir kez yaparsın, sonra site buluta bağlı çalışır.
Toplam süre: **yaklaşık 10 dakika.**

---

## 1. Supabase projesi aç

1. [supabase.com](https://supabase.com) → **Start your project** → GitHub ile giriş
2. **New project**
   - **Name:** `duru-atolye`
   - **Database Password:** güçlü bir şifre üret ve **bir yere kaydet**
   - **Region:** `Central EU (Frankfurt)` — Türkiye'ye en yakını, en hızlısı
3. Proje kurulana kadar bekle (1-2 dakika)

---

## 2. Veritabanını kur

1. Sol menü → **SQL Editor** → **New query**
2. `supabase/schema.sql` dosyasının **tamamını** kopyala, yapıştır
3. **Run** (Ctrl+Enter)

`Success. No rows returned` görmelisin.

**Kontrol et:**
- **Table Editor** → `profiller`, `cizimler`, `kitaplar`, `sayfalar`, `gunler` görünüyor
- **Storage** → `cizimler` kovası var ve **Public kapalı**

---

## 3. E‑posta onayını kapat (önemli)

Duru gibi çocuk kullanıcılar e‑posta onayıyla uğraşmasın diye:

**Authentication → Sign In / Providers → Email → `Confirm email` KAPALI**

Kapatmazsan kayıt sonrası e‑posta onayı beklenir ve giriş yapılamaz.

---

## 4. Anahtarları al

**Project Settings → API** sayfasında iki değer var:

| Panel'deki adı | Ne işe yarar |
|---|---|
| **Project URL** | Projenin adresi |
| **anon / public** | Genel anahtar |

⚠️ **`service_role` anahtarını asla kullanma.** O anahtar tüm güvenliği atlar ve tarayıcıya asla gitmemeli.

---

## 5. Yerelde çalıştır

Proje kökünde `.env.local` dosyası oluştur:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Sonra:

```bash
npm run dev
```

`http://localhost:3000` → giriş ekranı gelmeli. **Hesap aç** ile Duru'ya hesap oluştur.

---

## 6. Vercel'e ekle

**Vercel → Proje → Settings → Environment Variables**

Aynı iki değişkeni ekle (Production, Preview, Development — üçünü de işaretle):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL = https://durununatolyesi.vercel.app
```

Sonra **Deployments → ⋯ → Redeploy**. Ortam değişkenleri build sırasında gömülür,
yeniden deploy etmeden etkili olmaz.

---

## Eski çizimler ne olacak?

Duru'nun **şu anki cihazındaki** çizimleri kaybolmaz. İlk kez giriş yaptığında
uygulama onları otomatik olarak buluta taşır ("Çizimlerin taşınıyor" ekranını
görürsün), sonra yerel kopyayı siler.

**Önemli:** Taşıma, çizimlerin bulunduğu **aynı tarayıcıda** ilk giriş yapıldığında
çalışır. Duru hangi cihazda çizdiyse ilk girişi oradan yapmalı.

---

## Güvenlik nasıl sağlanıyor?

- Her tabloda **satır düzeyi güvenlik (RLS)** açık: kullanıcı sadece kendi
  satırlarını görebilir. Bu, uygulama kodunda değil **veritabanında** zorlanır.
- Çizim dosyaları **gizli** bir kovada, `{kullanici_id}/` klasörlerinde.
  Kimse başkasının klasörüne yazamaz, okuyamaz, silemez.
- Görseller süreli **imzalı adreslerle** gösterilir; adres paylaşılsa bile
  6 saat sonra geçersiz olur.
- Şifreler Supabase Auth tarafından saklanır, biz hiç görmeyiz.

---

## Sorun giderme

**"Kurulum tamamlanmamış" yazıyor**
`.env.local` yok ya da yanlış. Dosya adını ve `NEXT_PUBLIC_` önekini kontrol et,
sonra sunucuyu yeniden başlat (ortam değişkenleri sıcak yeniden yüklenmez).

**Kayıt oluyor ama giriş yapılamıyor**
E‑posta onayı açık kalmış. Adım 3'e dön.

**Çizim yüklenmiyor**
Storage → `cizimler` kovası var mı? `schema.sql`'i tekrar çalıştır, zararsızdır.

**"Verilerin yüklenemedi"**
Anahtarlar yanlış olabilir, ya da `schema.sql` çalıştırılmamıştır.
