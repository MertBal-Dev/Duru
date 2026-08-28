"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Ikon from "@/components/Ikon";
import AltMenu from "@/components/AltMenu";
import Tuval from "@/components/Tuval";
import Konfeti from "@/components/Konfeti";
import { cerceveNo, useAtolye } from "@/lib/atolye";
import { gununGorevi } from "@/lib/gorevler";

export default function CizSayfasi() {
  const { cizimEkle } = useAtolye();
  const router = useRouter();
  const gorev = gununGorevi();

  const [bekleyen, setBekleyen] = useState<{ png: Blob; onizleme: string } | null>(null);
  const [baslik, setBaslik] = useState("");
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kutlama, setKutlama] = useState<{ id: string; ad: string } | null>(null);

  /* Geçici önizleme adresini serbest bırak — bellek sızmasın */
  useEffect(() => {
    return () => {
      if (bekleyen) URL.revokeObjectURL(bekleyen.onizleme);
    };
  }, [bekleyen]);

  /* Kutlama bitince müzeye geç */
  useEffect(() => {
    if (!kutlama) return;
    const z = setTimeout(() => router.push("/muze"), 2100);
    return () => clearTimeout(z);
  }, [kutlama, router]);

  async function asmayiTamamla() {
    if (!bekleyen || yukleniyor) return;
    setHata(null);
    setYukleniyor(true);
    const ad = baslik.trim() || "İsimsiz çizim";
    const id = await cizimEkle(bekleyen.png, ad, gorev);
    setYukleniyor(false);

    if (!id) {
      setHata("Çizim yüklenemedi. İnternetini kontrol edip tekrar dener misin?");
      return;
    }
    setKutlama({ id, ad });
  }

  /* ---------- Kutlama ekranı ---------- */
  if (kutlama && bekleyen) {
    return (
      <>
        <Konfeti />
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-10">
          <div
            className={`cerceve cerceve-n${cerceveNo(kutlama.id)} cerceve-otur w-full max-w-xs`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bekleyen.onizleme}
              alt={kutlama.ad}
              className="aspect-square w-full rounded-[12px] bg-white object-cover"
            />
          </div>

          <div className="yazi-belir mt-7 text-center">
            <h1 className="mb-2 text-[30px] text-ink">Müzene asıldı!</h1>
            <p className="font-display text-xl font-bold text-pembe">“{kutlama.ad}”</p>
            <p className="nabiz mt-4 text-sm font-bold text-inksoft">
              Müzene götürüyorum…
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <main className="giris mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-4">
        <header className="mb-4 flex items-center gap-3">
          <Link
            href="/"
            aria-label="Atölyeye dön"
            className="clay flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center text-mor transition-transform duration-200 active:translate-y-1"
          >
            <Ikon ad="geri" boyut={22} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-pembe">
              Bugünün görevi
            </p>
            <h1 className="text-[19px] leading-tight text-ink">{gorev}</h1>
          </div>
        </header>

        {!bekleyen && (
          <Tuval onKaydet={(png, onizleme) => setBekleyen({ png, onizleme })} />
        )}

        {bekleyen && (
          <section className="clay pencere-ac p-5">
            <h2 className="mb-1 text-xl text-ink">Çizimin hazır!</h2>
            <p className="mb-4 text-sm font-semibold text-inksoft">
              Ona bir isim ver, sonra müzendeki çerçevesine asalım.
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bekleyen.onizleme}
              alt="Az önce yaptığın çizim"
              className="mb-4 w-full rounded-[16px] border-[3px] border-line bg-white"
            />

            <label
              htmlFor="cizim-adi"
              className="mb-2 block text-[12px] font-bold uppercase tracking-[0.1em] text-inksoft"
            >
              Çizimin adı
            </label>
            <input
              id="cizim-adi"
              className="clay-input mb-4"
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              placeholder="Örnek: Gökkuşağı Atı"
              maxLength={40}
              autoFocus
            />

            {hata && (
              <p
                role="alert"
                className="mb-4 rounded-[14px] border-[3px] border-uyari/30 bg-uyari/10 p-3 text-sm font-bold text-uyari"
              >
                {hata}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(bekleyen.onizleme);
                  setBekleyen(null);
                  setHata(null);
                }}
                disabled={yukleniyor}
                className="clay-btn beyaz flex-1"
              >
                Devam et
              </button>
              <button
                type="button"
                onClick={asmayiTamamla}
                disabled={yukleniyor}
                className="clay-btn pembe flex-[1.4]"
              >
                {yukleniyor ? (
                  <span className="nabiz">Yükleniyor…</span>
                ) : (
                  <>
                    <Ikon ad="cerceve" boyut={20} />
                    Müzeye as
                  </>
                )}
              </button>
            </div>
          </section>
        )}
      </main>

      <AltMenu />
    </>
  );
}
