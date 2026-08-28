"use client";

import { useState } from "react";
import Link from "next/link";
import Ikon from "@/components/Ikon";
import AltMenu from "@/components/AltMenu";
import { useAtolye } from "@/lib/atolye";

export default function Ben() {
  const { isim, isimDegistir, oturum, cizimler, kitaplar, seri, cikisYap } = useAtolye();
  const [cikisOnay, setCikisOnay] = useState(false);

  const toplamKalp = cizimler.reduce((t, c) => t + c.kalp, 0);
  const toplamSayfa = kitaplar.reduce(
    (t, k) => t + k.sayfalar.filter((s) => s.metin.trim()).length,
    0,
  );

  return (
    <>
      <main className="giris mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-4">
        <header className="mb-5 flex items-center gap-3">
          <Link
            href="/"
            aria-label="Atölyeye dön"
            className="clay flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center text-mor transition-transform duration-200 active:translate-y-1"
          >
            <Ikon ad="geri" boyut={22} />
          </Link>
          <h1 className="text-[26px] text-ink">Ben</h1>
        </header>

        {/* ---------- İsim ---------- */}
        <section className="clay mb-4 p-5">
          <label
            htmlFor="isim"
            className="mb-2 block text-[12px] font-bold uppercase tracking-[0.1em] text-pembe"
          >
            Adın
          </label>
          <input
            id="isim"
            className="clay-input"
            value={isim}
            onChange={(e) => isimDegistir(e.target.value)}
            maxLength={24}
            placeholder="Adın"
          />
          <p className="mt-3 text-sm font-semibold text-inksoft">
            Giriş yaptığın e‑posta:{" "}
            <span className="font-bold text-ink">{oturum?.user.email}</span>
          </p>
        </section>

        {/* ---------- Sayılar ---------- */}
        <section className="clay mb-4 p-5">
          <h2 className="mb-4 text-xl text-ink">Sayılarım</h2>
          <div className="grid grid-cols-2 gap-3 text-center">
            {[
              ["ÇİZİM", cizimler.length],
              ["GÜN SERİ", seri],
              ["KALP", toplamKalp],
              ["YAZILI SAYFA", toplamSayfa],
            ].map(([ad, deger]) => (
              <div key={ad as string} className="clay-soft rounded-[16px] p-4">
                <b className="block font-display text-[28px] font-extrabold tabular-nums text-mor">
                  {deger}
                </b>
                <span className="text-[11.5px] font-bold text-inksoft">{ad}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Güvenlik notu ---------- */}
        <section className="clay-soft mb-4 flex items-start gap-3 p-4">
          <span className="mt-0.5 shrink-0 text-basari">
            <Ikon ad="onay" boyut={20} />
          </span>
          <p className="text-sm font-semibold text-inksoft">
            Çizimlerin ve kitapların bulutta, senin hesabında saklanıyor. Hangi cihazdan
            girersen gir hepsi yanında — ve başka kimse göremez.
          </p>
        </section>

        {/* ---------- Çıkış ---------- */}
        {!cikisOnay ? (
          <button
            type="button"
            onClick={() => setCikisOnay(true)}
            className="clay-btn beyaz w-full"
          >
            <Ikon ad="geri" boyut={19} />
            Çıkış yap
          </button>
        ) : (
          <section className="clay pencere-ac p-4">
            <p className="mb-3 text-center text-sm font-bold text-ink">
              Çıkmak istediğine emin misin? Tekrar girmek için şifren gerekecek.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCikisOnay(false)}
                className="clay-btn beyaz flex-1"
              >
                Vazgeç
              </button>
              <button type="button" onClick={cikisYap} className="clay-btn pembe flex-1">
                Evet, çık
              </button>
            </div>
          </section>
        )}
      </main>

      <AltMenu />
    </>
  );
}
