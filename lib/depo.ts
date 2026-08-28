"use client";

import { useCallback, useEffect, useState } from "react";

/* ============================================================
   VERİ KATMANI
   Şu an tarayıcı hafızasında (localStorage) saklıyoruz.
   Supabase'e geçerken sadece bu dosyanın içi değişecek —
   sayfalar aynı fonksiyonları çağırmaya devam edecek.
   ============================================================ */

export type Cizim = {
  id: string;
  baslik: string;
  /** PNG data URL */
  veri: string;
  tarih: string;
  /** O gün hangi görev için çizildi */
  gorev?: string;
  kalp: number;
};

export type Sayfa = {
  id: string;
  metin: string;
  /** Müzeden seçilen çizimin id'si — kitabın resmi olur */
  cizimId?: string;
};

export type Kitap = {
  id: string;
  baslik: string;
  kapakCizimId?: string;
  sayfalar: Sayfa[];
  tarih: string;
};

export type Depo = {
  surum: 1;
  isim: string;
  cizimler: Cizim[];
  kitaplar: Kitap[];
  /** "2026-08-28" -> o gün görev tamamlandı mı */
  gunler: Record<string, boolean>;
};

const ANAHTAR = "duru.atolye.v1";

export const BOS_DEPO: Depo = {
  surum: 1,
  isim: "Duru",
  cizimler: [],
  kitaplar: [],
  gunler: {},
};

export function bugun(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function yeniId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function oku(): Depo {
  if (typeof window === "undefined") return BOS_DEPO;
  try {
    const ham = window.localStorage.getItem(ANAHTAR);
    if (!ham) return BOS_DEPO;
    const d = JSON.parse(ham) as Partial<Depo>;
    return {
      ...BOS_DEPO,
      ...d,
      cizimler: Array.isArray(d.cizimler) ? d.cizimler : [],
      kitaplar: Array.isArray(d.kitaplar) ? d.kitaplar : [],
      gunler: d.gunler && typeof d.gunler === "object" ? d.gunler : {},
    };
  } catch {
    return BOS_DEPO;
  }
}

function yaz(d: Depo) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ANAHTAR, JSON.stringify(d));
  } catch {
    // Hafıza dolduysa sessizce geç — kullanıcıya çizim ekranında söylüyoruz.
  }
}

/* ------------------------------------------------------------
   useDepo — sayfaların kullandığı tek giriş noktası
   `hazir` false iken hiçbir şey çizme (sunucu/tarayıcı uyumsuzluğu olmasın)
   ------------------------------------------------------------ */

export function useDepo() {
  const [depo, setDepo] = useState<Depo>(BOS_DEPO);
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    setDepo(oku());
    setHazir(true);
  }, []);

  const guncelle = useCallback((degistir: (d: Depo) => Depo) => {
    setDepo((onceki) => {
      const yeni = degistir(onceki);
      yaz(yeni);
      return yeni;
    });
  }, []);

  /* --- çizimler --- */

  const cizimEkle = useCallback(
    (c: Omit<Cizim, "id" | "tarih" | "kalp">) => {
      const id = yeniId();
      guncelle((d) => ({
        ...d,
        cizimler: [{ ...c, id, tarih: new Date().toISOString(), kalp: 0 }, ...d.cizimler],
        gunler: { ...d.gunler, [bugun()]: true },
      }));
      return id;
    },
    [guncelle],
  );

  const cizimSil = useCallback(
    (id: string) => {
      guncelle((d) => ({
        ...d,
        cizimler: d.cizimler.filter((c) => c.id !== id),
        // Silinen çizim bir kitapta kullanılıyorsa oradan da düşür
        kitaplar: d.kitaplar.map((k) => ({
          ...k,
          kapakCizimId: k.kapakCizimId === id ? undefined : k.kapakCizimId,
          sayfalar: k.sayfalar.map((s) =>
            s.cizimId === id ? { ...s, cizimId: undefined } : s,
          ),
        })),
      }));
    },
    [guncelle],
  );

  const kalpAt = useCallback(
    (id: string) => {
      guncelle((d) => ({
        ...d,
        cizimler: d.cizimler.map((c) =>
          c.id === id ? { ...c, kalp: c.kalp + 1 } : c,
        ),
      }));
    },
    [guncelle],
  );

  const cizimAdiDegistir = useCallback(
    (id: string, baslik: string) => {
      guncelle((d) => ({
        ...d,
        cizimler: d.cizimler.map((c) => (c.id === id ? { ...c, baslik } : c)),
      }));
    },
    [guncelle],
  );

  /* --- kitaplar --- */

  const kitapEkle = useCallback(
    (baslik: string) => {
      const id = yeniId();
      guncelle((d) => ({
        ...d,
        kitaplar: [
          {
            id,
            baslik,
            sayfalar: [{ id: yeniId(), metin: "" }],
            tarih: new Date().toISOString(),
          },
          ...d.kitaplar,
        ],
      }));
      return id;
    },
    [guncelle],
  );

  const kitapGuncelle = useCallback(
    (id: string, degistir: (k: Kitap) => Kitap) => {
      guncelle((d) => ({
        ...d,
        kitaplar: d.kitaplar.map((k) => (k.id === id ? degistir(k) : k)),
      }));
    },
    [guncelle],
  );

  const kitapSil = useCallback(
    (id: string) => {
      guncelle((d) => ({ ...d, kitaplar: d.kitaplar.filter((k) => k.id !== id) }));
    },
    [guncelle],
  );

  const isimDegistir = useCallback(
    (isim: string) => guncelle((d) => ({ ...d, isim })),
    [guncelle],
  );

  return {
    depo,
    hazir,
    cizimEkle,
    cizimSil,
    kalpAt,
    cizimAdiDegistir,
    kitapEkle,
    kitapGuncelle,
    kitapSil,
    isimDegistir,
  };
}

/* ------------------------------------------------------------
   Yardımcılar
   ------------------------------------------------------------ */

/** Üst üste kaç gün çizim yapıldı */
export function seri(gunler: Record<string, boolean>): number {
  let n = 0;
  const d = new Date();
  const anahtar = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
      x.getDate(),
    ).padStart(2, "0")}`;
  if (!gunler[anahtar(d)]) d.setDate(d.getDate() - 1);
  while (gunler[anahtar(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Çizimin çerçeve rengi — id'den türetilir, hep aynı kalır */
export function cerceveNo(id: string): number {
  let t = 0;
  for (let i = 0; i < id.length; i++) t = (t + id.charCodeAt(i)) % 6;
  return t + 1;
}

export function tarihYaz(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
