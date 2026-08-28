"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, bulutVar } from "./supabase";

/* ============================================================
   ATÖLYE VERİ KATMANI

   TEK KAYNAK: Supabase.
   Burada localStorage'a hiçbir kullanıcı verisi yazılmaz.
   (Tek istisna, çizim ekranındaki "henüz kaydedilmemiş karalama"
   tamponu — o da Tuval bileşeninin içinde ve kaydedilince silinir.)

   Tüm sayfalar tek bir sağlayıcıdan beslenir: veri bir kez
   yüklenir, sayfa değiştikçe tekrar tekrar çekilmez.
   ============================================================ */

export type Cizim = {
  id: string;
  baslik: string;
  dosyaYolu: string;
  /** Görüntülemek için imzalı adres — süreli, her yüklemede yenilenir */
  url: string;
  gorev?: string;
  kalp: number;
  tarih: string;
};

export type Sayfa = {
  id: string;
  sira: number;
  metin: string;
  cizimId?: string;
};

export type Kitap = {
  id: string;
  baslik: string;
  kapakCizimId?: string;
  sayfalar: Sayfa[];
  tarih: string;
};

export type Durum =
  | "yukleniyor"   // oturum kontrol ediliyor
  | "girissiz"     // giriş yapılmamış
  | "hazir"        // veri yüklendi
  | "kurulumsuz";  // Supabase anahtarları tanımlı değil

type AtolyeDegeri = {
  durum: Durum;
  oturum: Session | null;
  isim: string;
  cizimler: Cizim[];
  kitaplar: Kitap[];
  seri: number;
  bugunYapildi: boolean;
  hata: string | null;
  tasiniyor: boolean;

  yenile: () => Promise<void>;
  cikisYap: () => Promise<void>;
  isimDegistir: (isim: string) => Promise<void>;

  cizimEkle: (png: Blob, baslik: string, gorev?: string) => Promise<string | null>;
  cizimSil: (id: string) => Promise<void>;
  cizimAdiDegistir: (id: string, baslik: string) => Promise<void>;
  kalpAt: (id: string) => Promise<void>;

  kitapEkle: (baslik: string, ilkSayfa?: string) => Promise<string | null>;
  kitapAdiDegistir: (id: string, baslik: string) => Promise<void>;
  kitapSil: (id: string) => Promise<void>;
  sayfaEkle: (kitapId: string) => Promise<void>;
  sayfaSil: (kitapId: string, sayfaId: string) => Promise<void>;
  sayfaYaz: (kitapId: string, sayfaId: string, metin: string) => Promise<void>;
  sayfaResmi: (kitapId: string, sayfaId: string, cizimId?: string) => Promise<void>;
};

const Baglam = createContext<AtolyeDegeri | null>(null);

export function useAtolye(): AtolyeDegeri {
  const d = useContext(Baglam);
  if (!d) throw new Error("useAtolye, AtolyeSaglayici içinde kullanılmalı");
  return d;
}

/* ------------------------------------------------------------ */

const ESKI_ANAHTAR = "duru.atolye.v1";
const IMZA_SURESI = 60 * 60 * 6; // 6 saat

export function AtolyeSaglayici({ children }: { children: React.ReactNode }) {
  const sb = supabase();

  const [durum, setDurum] = useState<Durum>(
    bulutVar ? "yukleniyor" : "kurulumsuz",
  );
  const [oturum, setOturum] = useState<Session | null>(null);
  const [isim, setIsim] = useState("Sanatçı");
  const [cizimler, setCizimler] = useState<Cizim[]>([]);
  const [kitaplar, setKitaplar] = useState<Kitap[]>([]);
  const [seri, setSeri] = useState(0);
  const [bugunYapildi, setBugunYapildi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [tasiniyor, setTasiniyor] = useState(false);
  const tasindiRef = useRef(false);

  /* ---------- Oturumu izle ---------- */

  useEffect(() => {
    if (!sb) return;
    let iptal = false;

    sb.auth.getSession().then(({ data }) => {
      if (iptal) return;
      setOturum(data.session);
      if (!data.session) setDurum("girissiz");
    });

    const { data: abone } = sb.auth.onAuthStateChange((_olay, o) => {
      setOturum(o);
      if (!o) {
        setCizimler([]);
        setKitaplar([]);
        setSeri(0);
        setBugunYapildi(false);
        setDurum("girissiz");
      }
    });

    return () => {
      iptal = true;
      abone.subscription.unsubscribe();
    };
  }, [sb]);

  /* ---------- Veriyi çek ---------- */

  const yenile = useCallback(async () => {
    if (!sb || !oturum) return;
    const uid = oturum.user.id;
    setHata(null);

    try {
      const [pr, cz, kt, sy, sr, bg] = await Promise.all([
        sb.from("profiller").select("isim").eq("id", uid).maybeSingle(),
        sb
          .from("cizimler")
          .select("id, baslik, dosya_yolu, gorev, kalp, olusturuldu")
          .eq("kullanici_id", uid)
          .order("olusturuldu", { ascending: false }),
        sb
          .from("kitaplar")
          .select("id, baslik, kapak_cizim_id, olusturuldu")
          .eq("kullanici_id", uid)
          .order("olusturuldu", { ascending: false }),
        sb.from("sayfalar").select("id, kitap_id, sira, metin, cizim_id"),
        sb.rpc("seri_hesapla"),
        sb
          .from("gunler")
          .select("gun")
          .eq("kullanici_id", uid)
          .eq("gun", bugunAnahtari())
          .maybeSingle(),
      ]);

      if (cz.error) throw cz.error;
      if (kt.error) throw kt.error;
      if (sy.error) throw sy.error;

      setIsim(pr.data?.isim ?? "Sanatçı");

      // Çizim dosyaları için imzalı adresler — tek istekte hepsi
      const satirlar = cz.data ?? [];
      const yollar = satirlar.map((s) => s.dosya_yolu);
      const adresler = new Map<string, string>();
      if (yollar.length) {
        const { data: imzali } = await sb.storage
          .from("cizimler")
          .createSignedUrls(yollar, IMZA_SURESI);
        for (const i of imzali ?? []) {
          if (i.path && i.signedUrl) adresler.set(i.path, i.signedUrl);
        }
      }

      setCizimler(
        satirlar.map((s) => ({
          id: s.id,
          baslik: s.baslik,
          dosyaYolu: s.dosya_yolu,
          url: adresler.get(s.dosya_yolu) ?? "",
          gorev: s.gorev ?? undefined,
          kalp: s.kalp,
          tarih: s.olusturuldu,
        })),
      );

      const sayfalarByKitap = new Map<string, Sayfa[]>();
      for (const s of sy.data ?? []) {
        const liste = sayfalarByKitap.get(s.kitap_id) ?? [];
        liste.push({
          id: s.id,
          sira: s.sira,
          metin: s.metin,
          cizimId: s.cizim_id ?? undefined,
        });
        sayfalarByKitap.set(s.kitap_id, liste);
      }

      setKitaplar(
        (kt.data ?? []).map((k) => ({
          id: k.id,
          baslik: k.baslik,
          kapakCizimId: k.kapak_cizim_id ?? undefined,
          tarih: k.olusturuldu,
          sayfalar: (sayfalarByKitap.get(k.id) ?? []).sort((a, b) => a.sira - b.sira),
        })),
      );

      setSeri(typeof sr.data === "number" ? sr.data : 0);
      setBugunYapildi(Boolean(bg.data));
      setDurum("hazir");
    } catch {
      setHata("Verilerin yüklenemedi. İnternetini kontrol edip tekrar dene.");
      setDurum("hazir");
    }
  }, [sb, oturum]);

  /* ---------- Giriş yapılınca: önce eski veriyi taşı, sonra yükle ---------- */

  useEffect(() => {
    if (!sb || !oturum) return;
    let iptal = false;

    (async () => {
      if (!tasindiRef.current) {
        tasindiRef.current = true;
        const tasindiMi = await eskiVeriyiTasi(oturum.user.id, setTasiniyor);
        if (tasindiMi && !iptal) {
          // taşıma bitti, aşağıdaki yenile() taze veriyi çekecek
        }
      }
      if (!iptal) await yenile();
    })();

    return () => {
      iptal = true;
    };
  }, [sb, oturum, yenile]);

  /* ---------- Eylemler ---------- */

  const cikisYap = useCallback(async () => {
    if (!sb) return;
    await sb.auth.signOut();
  }, [sb]);

  const isimDegistir = useCallback(
    async (yeni: string) => {
      if (!sb || !oturum) return;
      setIsim(yeni);
      await sb.from("profiller").update({ isim: yeni }).eq("id", oturum.user.id);
    },
    [sb, oturum],
  );

  const cizimEkle = useCallback(
    async (png: Blob, baslik: string, gorev?: string) => {
      if (!sb || !oturum) return null;
      const uid = oturum.user.id;
      const id = crypto.randomUUID();
      const yol = `${uid}/${id}.png`;

      const { error: yukHata } = await sb.storage
        .from("cizimler")
        .upload(yol, png, { contentType: "image/png", upsert: true });
      if (yukHata) {
        setHata("Çizim yüklenemedi. İnternetini kontrol edip tekrar dene.");
        return null;
      }

      const { error: satirHata } = await sb.from("cizimler").insert({
        id,
        kullanici_id: uid,
        baslik: baslik.trim() || "İsimsiz çizim",
        dosya_yolu: yol,
        gorev: gorev ?? null,
      });
      if (satirHata) {
        await sb.storage.from("cizimler").remove([yol]); // yarım kayıt bırakma
        setHata("Çizim kaydedilemedi. Tekrar dener misin?");
        return null;
      }

      await sb
        .from("gunler")
        .upsert({ kullanici_id: uid, gun: bugunAnahtari() }, { onConflict: "kullanici_id,gun" });

      await yenile();
      return id;
    },
    [sb, oturum, yenile],
  );

  const cizimSil = useCallback(
    async (id: string) => {
      if (!sb) return;
      const c = cizimler.find((x) => x.id === id);
      setCizimler((o) => o.filter((x) => x.id !== id)); // anında tepki
      await sb.from("cizimler").delete().eq("id", id);
      if (c) await sb.storage.from("cizimler").remove([c.dosyaYolu]);
      await yenile();
    },
    [sb, cizimler, yenile],
  );

  const cizimAdiDegistir = useCallback(
    async (id: string, baslik: string) => {
      if (!sb) return;
      setCizimler((o) => o.map((c) => (c.id === id ? { ...c, baslik } : c)));
      await sb.from("cizimler").update({ baslik }).eq("id", id);
    },
    [sb],
  );

  const kalpAt = useCallback(
    async (id: string) => {
      if (!sb) return;
      const simdiki = cizimler.find((c) => c.id === id)?.kalp ?? 0;
      setCizimler((o) => o.map((c) => (c.id === id ? { ...c, kalp: c.kalp + 1 } : c)));
      await sb.from("cizimler").update({ kalp: simdiki + 1 }).eq("id", id);
    },
    [sb, cizimler],
  );

  const kitapEkle = useCallback(
    async (baslik: string, ilkSayfa = "") => {
      if (!sb) return null;
      const { data, error } = await sb.rpc("kitap_olustur", {
        p_baslik: baslik,
        p_ilk_sayfa: ilkSayfa,
      });
      if (error) {
        setHata("Kitap oluşturulamadı. Tekrar dener misin?");
        return null;
      }
      await yenile();
      return data as string;
    },
    [sb, yenile],
  );

  const kitapAdiDegistir = useCallback(
    async (id: string, baslik: string) => {
      if (!sb) return;
      setKitaplar((o) => o.map((k) => (k.id === id ? { ...k, baslik } : k)));
      await sb.from("kitaplar").update({ baslik }).eq("id", id);
    },
    [sb],
  );

  const kitapSil = useCallback(
    async (id: string) => {
      if (!sb) return;
      setKitaplar((o) => o.filter((k) => k.id !== id));
      await sb.from("kitaplar").delete().eq("id", id);
      await yenile();
    },
    [sb, yenile],
  );

  const sayfaEkle = useCallback(
    async (kitapId: string) => {
      if (!sb) return;
      const k = kitaplar.find((x) => x.id === kitapId);
      const sira = k ? k.sayfalar.length : 0;
      const { data } = await sb
        .from("sayfalar")
        .insert({ kitap_id: kitapId, sira, metin: "" })
        .select("id")
        .single();
      if (data) {
        setKitaplar((o) =>
          o.map((x) =>
            x.id === kitapId
              ? { ...x, sayfalar: [...x.sayfalar, { id: data.id, sira, metin: "" }] }
              : x,
          ),
        );
      }
    },
    [sb, kitaplar],
  );

  const sayfaSil = useCallback(
    async (kitapId: string, sayfaId: string) => {
      if (!sb) return;
      setKitaplar((o) =>
        o.map((k) =>
          k.id === kitapId
            ? { ...k, sayfalar: k.sayfalar.filter((s) => s.id !== sayfaId) }
            : k,
        ),
      );
      await sb.from("sayfalar").delete().eq("id", sayfaId);
    },
    [sb],
  );

  const sayfaYaz = useCallback(
    async (kitapId: string, sayfaId: string, metin: string) => {
      if (!sb) return;
      setKitaplar((o) =>
        o.map((k) =>
          k.id === kitapId
            ? {
                ...k,
                sayfalar: k.sayfalar.map((s) => (s.id === sayfaId ? { ...s, metin } : s)),
              }
            : k,
        ),
      );
      await sb.from("sayfalar").update({ metin }).eq("id", sayfaId);
    },
    [sb],
  );

  const sayfaResmi = useCallback(
    async (kitapId: string, sayfaId: string, cizimId?: string) => {
      if (!sb) return;
      setKitaplar((o) =>
        o.map((k) =>
          k.id === kitapId
            ? {
                ...k,
                kapakCizimId: k.kapakCizimId ?? cizimId,
                sayfalar: k.sayfalar.map((s) => (s.id === sayfaId ? { ...s, cizimId } : s)),
              }
            : k,
        ),
      );
      await sb.from("sayfalar").update({ cizim_id: cizimId ?? null }).eq("id", sayfaId);

      const k = kitaplar.find((x) => x.id === kitapId);
      if (cizimId && k && !k.kapakCizimId) {
        await sb.from("kitaplar").update({ kapak_cizim_id: cizimId }).eq("id", kitapId);
      }
    },
    [sb, kitaplar],
  );

  const deger = useMemo<AtolyeDegeri>(
    () => ({
      durum,
      oturum,
      isim,
      cizimler,
      kitaplar,
      seri,
      bugunYapildi,
      hata,
      tasiniyor,
      yenile,
      cikisYap,
      isimDegistir,
      cizimEkle,
      cizimSil,
      cizimAdiDegistir,
      kalpAt,
      kitapEkle,
      kitapAdiDegistir,
      kitapSil,
      sayfaEkle,
      sayfaSil,
      sayfaYaz,
      sayfaResmi,
    }),
    [
      durum, oturum, isim, cizimler, kitaplar, seri, bugunYapildi, hata, tasiniyor,
      yenile, cikisYap, isimDegistir, cizimEkle, cizimSil, cizimAdiDegistir, kalpAt,
      kitapEkle, kitapAdiDegistir, kitapSil, sayfaEkle, sayfaSil, sayfaYaz, sayfaResmi,
    ],
  );

  return <Baglam.Provider value={deger}>{children}</Baglam.Provider>;
}

/* ------------------------------------------------------------
   Yardımcılar
   ------------------------------------------------------------ */

export function bugunAnahtari(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
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

/* ------------------------------------------------------------
   TEK SEFERLİK TAŞIMA
   Eski sürümde veriler tarayıcı hafızasındaydı. İlk girişte
   bulunursa buluta taşınır ve YEREL KOPYA SİLİNİR — böylece
   iki kaynak birden yaşamaz.
   ------------------------------------------------------------ */

async function eskiVeriyiTasi(
  uid: string,
  bildir: (v: boolean) => void,
): Promise<boolean> {
  const sb = supabase();
  if (!sb) return false;

  let eski: {
    isim?: string;
    cizimler?: { id: string; baslik: string; veri: string; gorev?: string; kalp?: number }[];
    kitaplar?: { baslik: string; sayfalar?: { metin: string }[] }[];
  } | null = null;

  try {
    const ham = localStorage.getItem(ESKI_ANAHTAR);
    if (!ham) return false;
    eski = JSON.parse(ham);
  } catch {
    return false;
  }
  if (!eski) return false;

  const cizimSayisi = eski.cizimler?.length ?? 0;
  const kitapSayisi = eski.kitaplar?.length ?? 0;
  if (cizimSayisi === 0 && kitapSayisi === 0) {
    localStorage.removeItem(ESKI_ANAHTAR);
    return false;
  }

  bildir(true);
  try {
    if (eski.isim) {
      await sb.from("profiller").update({ isim: eski.isim }).eq("id", uid);
    }

    for (const c of eski.cizimler ?? []) {
      try {
        const png = dataUrlToBlob(c.veri);
        if (!png) continue;
        const id = crypto.randomUUID();
        const yol = `${uid}/${id}.png`;
        const { error } = await sb.storage
          .from("cizimler")
          .upload(yol, png, { contentType: "image/png", upsert: true });
        if (error) continue;
        await sb.from("cizimler").insert({
          id,
          kullanici_id: uid,
          baslik: c.baslik || "İsimsiz çizim",
          dosya_yolu: yol,
          gorev: c.gorev ?? null,
          kalp: c.kalp ?? 0,
        });
      } catch {
        /* tek çizim taşınamadıysa diğerlerine devam et */
      }
    }

    for (const k of eski.kitaplar ?? []) {
      try {
        const { data: kitapId } = await sb.rpc("kitap_olustur", {
          p_baslik: k.baslik || "İsimsiz kitap",
          p_ilk_sayfa: k.sayfalar?.[0]?.metin ?? "",
        });
        if (!kitapId) continue;
        const kalan = (k.sayfalar ?? []).slice(1);
        if (kalan.length) {
          await sb.from("sayfalar").insert(
            kalan.map((s, i) => ({
              kitap_id: kitapId as string,
              sira: i + 1,
              metin: s.metin ?? "",
            })),
          );
        }
      } catch {
        /* tek kitap taşınamadıysa devam */
      }
    }

    // Taşıma bitti: yerel kopyayı SİL. Tek kaynak artık Supabase.
    localStorage.removeItem(ESKI_ANAHTAR);
    localStorage.removeItem("duru.sonSeri");
    return true;
  } finally {
    bildir(false);
  }
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [bas, veri] = dataUrl.split(",");
    if (!veri) return null;
    const tur = bas.match(/:(.*?);/)?.[1] ?? "image/png";
    const ikili = atob(veri);
    const dizi = new Uint8Array(ikili.length);
    for (let i = 0; i < ikili.length; i++) dizi[i] = ikili.charCodeAt(i);
    return new Blob([dizi], { type: tur });
  } catch {
    return null;
  }
}
