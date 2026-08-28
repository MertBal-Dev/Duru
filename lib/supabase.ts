"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/* ============================================================
   SUPABASE İSTEMCİSİ

   Anahtarlar tanımlı değilse null döner. Uygulama o zaman
   "yerel mod"da çalışır: veriler sadece bu cihazda saklanır.
   Böylece kurulum yapılmadan da site çalışır, kurulum yapılınca
   buluta geçer.
   ============================================================ */

const ADRES = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANAHTAR = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let istemci: SupabaseClient | null = null;

export function supabase(): SupabaseClient | null {
  if (!ADRES || !ANAHTAR) return null;
  if (!istemci) istemci = createBrowserClient(ADRES, ANAHTAR);
  return istemci;
}

/** Bulut modu açık mı — arayüzde "yerel mod" uyarısı göstermek için */
export const bulutVar = Boolean(ADRES && ANAHTAR);

/* ------------------------------------------------------------
   Veritabanı satır tipleri
   ------------------------------------------------------------ */

export type CizimSatiri = {
  id: string;
  kullanici_id: string;
  baslik: string;
  dosya_yolu: string;
  gorev: string | null;
  kalp: number;
  olusturuldu: string;
};

export type KitapSatiri = {
  id: string;
  kullanici_id: string;
  baslik: string;
  kapak_cizim_id: string | null;
  olusturuldu: string;
};

export type SayfaSatiri = {
  id: string;
  kitap_id: string;
  sira: number;
  metin: string;
  cizim_id: string | null;
};

/* ------------------------------------------------------------
   Hata mesajlarını Türkçeye çevir — Duru İngilizce hata görmesin
   ------------------------------------------------------------ */

export function hataCevir(mesaj: string): string {
  const m = mesaj.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E‑posta ya da şifre yanlış. Tekrar dener misin?";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Bu e‑posta zaten kayıtlı. Giriş yapmayı dene.";
  if (m.includes("password should be at least"))
    return "Şifre en az 6 karakter olmalı.";
  if (m.includes("unable to validate email") || m.includes("invalid email"))
    return "E‑posta adresi doğru görünmüyor.";
  if (m.includes("email not confirmed"))
    return "E‑postanı onaylaman gerekiyor. Gelen kutuna bak.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Çok fazla denedin. Biraz bekleyip tekrar dene.";
  if (m.includes("network") || m.includes("fetch"))
    return "İnternete bağlanamadım. Bağlantını kontrol eder misin?";
  return "Bir şeyler ters gitti. Tekrar dener misin?";
}
