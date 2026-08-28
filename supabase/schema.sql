-- ============================================================
-- DURU'NUN ATÖLYESİ — TAM VERİTABANI ŞEMASI
--
-- KURULUM:
--   Supabase panel → SQL Editor → New query → bu dosyanın
--   TAMAMINI yapıştır → Run.
--
-- Tekrar çalıştırmak güvenlidir (her şey idempotent).
--
-- GÜVENLİK: Her kullanıcı yalnızca kendi verisini görür. Bu,
-- satır düzeyi güvenlik (RLS) ile VERİTABANININ KENDİSİNDE
-- zorlanır — uygulama kodundaki bir hata bile başkasının
-- çizimini sızdıramaz.
-- ============================================================


-- ============================================================
-- 1) PROFİLLER
-- ============================================================

create table if not exists public.profiller (
  id          uuid primary key references auth.users on delete cascade,
  isim        text not null default 'Sanatçı',
  olusturuldu timestamptz not null default now()
);

alter table public.profiller enable row level security;

drop policy if exists "profil_sec" on public.profiller;
create policy "profil_sec" on public.profiller
  for select using (auth.uid() = id);

drop policy if exists "profil_ekle" on public.profiller;
create policy "profil_ekle" on public.profiller
  for insert with check (auth.uid() = id);

drop policy if exists "profil_guncelle" on public.profiller;
create policy "profil_guncelle" on public.profiller
  for update using (auth.uid() = id) with check (auth.uid() = id);


-- Kayıt olan herkese otomatik profil aç
create or replace function public.yeni_kullanici()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiller (id, isim)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'isim'), ''), 'Sanatçı')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists yeni_kullanici_tetigi on auth.users;
create trigger yeni_kullanici_tetigi
  after insert on auth.users
  for each row execute function public.yeni_kullanici();


-- ============================================================
-- 2) ÇİZİMLER
--    Görselin kendisi Storage'da durur; burada kaydı tutulur.
-- ============================================================

create table if not exists public.cizimler (
  id           uuid primary key default gen_random_uuid(),
  kullanici_id uuid not null references auth.users on delete cascade,
  baslik       text not null default 'İsimsiz çizim',
  dosya_yolu   text not null,
  gorev        text,
  kalp         integer not null default 0 check (kalp >= 0),
  olusturuldu  timestamptz not null default now()
);

create index if not exists cizimler_kullanici_tarih
  on public.cizimler (kullanici_id, olusturuldu desc);

alter table public.cizimler enable row level security;

drop policy if exists "cizim_hepsi" on public.cizimler;
create policy "cizim_hepsi" on public.cizimler
  for all
  using (auth.uid() = kullanici_id)
  with check (auth.uid() = kullanici_id);


-- ============================================================
-- 3) KİTAPLAR
-- ============================================================

create table if not exists public.kitaplar (
  id             uuid primary key default gen_random_uuid(),
  kullanici_id   uuid not null references auth.users on delete cascade,
  baslik         text not null default 'İsimsiz kitap',
  kapak_cizim_id uuid references public.cizimler on delete set null,
  olusturuldu    timestamptz not null default now()
);

create index if not exists kitaplar_kullanici_tarih
  on public.kitaplar (kullanici_id, olusturuldu desc);

alter table public.kitaplar enable row level security;

drop policy if exists "kitap_hepsi" on public.kitaplar;
create policy "kitap_hepsi" on public.kitaplar
  for all
  using (auth.uid() = kullanici_id)
  with check (auth.uid() = kullanici_id);


-- ============================================================
-- 4) SAYFALAR
--    Sahiplik kitap üzerinden doğrulanır.
-- ============================================================

create table if not exists public.sayfalar (
  id       uuid primary key default gen_random_uuid(),
  kitap_id uuid not null references public.kitaplar on delete cascade,
  sira     integer not null default 0,
  metin    text not null default '',
  cizim_id uuid references public.cizimler on delete set null
);

create index if not exists sayfalar_kitap_sira
  on public.sayfalar (kitap_id, sira);

alter table public.sayfalar enable row level security;

drop policy if exists "sayfa_hepsi" on public.sayfalar;
create policy "sayfa_hepsi" on public.sayfalar
  for all
  using (
    exists (
      select 1 from public.kitaplar k
      where k.id = sayfalar.kitap_id and k.kullanici_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.kitaplar k
      where k.id = sayfalar.kitap_id and k.kullanici_id = auth.uid()
    )
  );


-- ============================================================
-- 5) GÜNLER — seri (streak) sayacı
-- ============================================================

create table if not exists public.gunler (
  kullanici_id uuid not null references auth.users on delete cascade,
  gun          date not null,
  primary key (kullanici_id, gun)
);

alter table public.gunler enable row level security;

drop policy if exists "gun_hepsi" on public.gunler;
create policy "gun_hepsi" on public.gunler
  for all
  using (auth.uid() = kullanici_id)
  with check (auth.uid() = kullanici_id);


-- ============================================================
-- 6) DEPOLAMA — çizim dosyaları
--    Kova GİZLİ. Yol düzeni: {kullanici_id}/{cizim_id}.png
--    Kimse başkasının klasörüne yazamaz, okuyamaz, silemez.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cizimler', 'cizimler', false, 5242880, array['image/png'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = 5242880,
      allowed_mime_types = array['image/png'];

drop policy if exists "dosya_yukle" on storage.objects;
create policy "dosya_yukle" on storage.objects
  for insert with check (
    bucket_id = 'cizimler'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dosya_oku" on storage.objects;
create policy "dosya_oku" on storage.objects
  for select using (
    bucket_id = 'cizimler'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- upsert (aynı yola tekrar yazma) için gerekli
drop policy if exists "dosya_guncelle" on storage.objects;
create policy "dosya_guncelle" on storage.objects
  for update using (
    bucket_id = 'cizimler'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "dosya_sil" on storage.objects;
create policy "dosya_sil" on storage.objects
  for delete using (
    bucket_id = 'cizimler'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ============================================================
-- 7) YARDIMCI: kitabı sayfalarıyla birlikte tek çağrıda oluştur
--    (Uygulama başlangıç kitabını böyle atomik kuruyor)
-- ============================================================

create or replace function public.kitap_olustur(
  p_baslik text,
  p_ilk_sayfa text default ''
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.kitaplar (kullanici_id, baslik)
  values (auth.uid(), coalesce(nullif(trim(p_baslik), ''), 'İsimsiz kitap'))
  returning id into v_id;

  insert into public.sayfalar (kitap_id, sira, metin)
  values (v_id, 0, coalesce(p_ilk_sayfa, ''));

  return v_id;
end;
$$;


-- ============================================================
-- 8) YARDIMCI: seri (üst üste kaç gün) hesabı veritabanında
-- ============================================================

create or replace function public.seri_hesapla()
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_gun date := current_date;
  v_sayi integer := 0;
begin
  -- Bugün henüz çizmediyse seri dünden başlar, bugün kırılmış sayılmaz
  if not exists (
    select 1 from public.gunler
    where kullanici_id = auth.uid() and gun = v_gun
  ) then
    v_gun := v_gun - 1;
  end if;

  while exists (
    select 1 from public.gunler
    where kullanici_id = auth.uid() and gun = v_gun
  ) loop
    v_sayi := v_sayi + 1;
    v_gun := v_gun - 1;
  end loop;

  return v_sayi;
end;
$$;


-- ============================================================
-- KURULUM BİTTİ
--
-- Kontrol listesi:
--   Table Editor  → profiller, cizimler, kitaplar, sayfalar, gunler
--   Storage       → "cizimler" kovası (Public KAPALI olmalı)
--   Authentication → Providers → Email açık
--
-- Not: Duru gibi çocuk kullanıcılar e-posta onayıyla uğraşmasın
-- diye Authentication → Providers → Email → "Confirm email"
-- ayarını KAPATMAN önerilir. Aksi halde kayıt sonrası e-posta
-- onayı beklenir ve giriş yapılamaz.
-- ============================================================
