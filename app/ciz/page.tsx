"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Ikon from "@/components/Ikon";
import AltMenu from "@/components/AltMenu";
import Tuval from "@/components/Tuval";
import { useDepo } from "@/lib/depo";
import { gununGorevi } from "@/lib/gorevler";

export default function CizSayfasi() {
  const { cizimEkle } = useDepo();
  const router = useRouter();
  const gorev = gununGorevi();

  const [bekleyen, setBekleyen] = useState<string | null>(null);
  const [baslik, setBaslik] = useState("");
  const [hata, setHata] = useState<string | null>(null);

  function asmayiTamamla() {
    if (!bekleyen) return;
    try {
      cizimEkle({
        baslik: baslik.trim() || "İsimsiz çizim",
        veri: bekleyen,
        gorev,
      });
      router.push("/muze");
    } catch {
      setHata(
        "Çizim kaydedilemedi — tarayıcı hafızası dolmuş olabilir. Müzeden birkaç eski çizimi silip tekrar dene.",
      );
    }
  }

  return (
    <>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-4">
        {/* ---------- Başlık ---------- */}
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

        {/* ---------- Çizim ---------- */}
        {!bekleyen && <Tuval onKaydet={(v) => setBekleyen(v)} />}

        {/* ---------- İsim verme ---------- */}
        {bekleyen && (
          <section className="clay p-5">
            <h2 className="mb-1 text-xl text-ink">Çizimin hazır!</h2>
            <p className="mb-4 text-sm font-semibold text-inksoft">
              Ona bir isim ver, sonra müzendeki çerçevesine asalım.
            </p>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bekleyen}
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
                  setBekleyen(null);
                  setHata(null);
                }}
                className="clay-btn beyaz flex-1"
              >
                Devam et
              </button>
              <button
                type="button"
                onClick={asmayiTamamla}
                className="clay-btn pembe flex-[1.4]"
              >
                <Ikon ad="cerceve" boyut={20} />
                Müzeye as
              </button>
            </div>
          </section>
        )}
      </main>

      <AltMenu />
    </>
  );
}
