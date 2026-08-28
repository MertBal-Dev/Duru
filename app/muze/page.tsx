"use client";

import { useState } from "react";
import Link from "next/link";
import Ikon from "@/components/Ikon";
import AltMenu from "@/components/AltMenu";
import { cerceveNo, tarihYaz, useDepo } from "@/lib/depo";

export default function Muze() {
  const { depo, hazir, kalpAt, cizimSil, cizimAdiDegistir } = useDepo();
  const [acikId, setAcikId] = useState<string | null>(null);
  const [silOnay, setSilOnay] = useState(false);
  /* Kalbe basınca yukarı uçan geçici kalp — n her basışta artar ki
     animasyon üst üste basıldığında da baştan çalışsın */
  const [ucan, setUcan] = useState<{ id: string; n: number } | null>(null);

  function kalpVer(id: string) {
    kalpAt(id);
    setUcan((o) => ({ id, n: o && o.id === id ? o.n + 1 : 1 }));
  }

  const acik = depo.cizimler.find((c) => c.id === acikId) ?? null;

  function kapat() {
    setAcikId(null);
    setSilOnay(false);
  }

  function indir(veri: string, ad: string) {
    const a = document.createElement("a");
    a.href = veri;
    a.download = `${ad || "cizim"}.png`;
    a.click();
  }

  return (
    <>
      <main className="giris mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-4">
        {/* ---------- Başlık ---------- */}
        <header className="mb-5 flex items-center gap-3">
          <Link
            href="/"
            aria-label="Atölyeye dön"
            className="clay flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center text-mor transition-transform duration-200 active:translate-y-1"
          >
            <Ikon ad="geri" boyut={22} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] text-ink">Müzem</h1>
            <p className="text-sm font-semibold text-inksoft">
              {hazir ? `${depo.cizimler.length} çizim asılı` : "…"}
            </p>
          </div>
          <Link href="/ciz" className="clay-btn kucuk">
            <Ikon ad="arti" boyut={19} />
            Yeni
          </Link>
        </header>

        {/* ---------- Boş müze ---------- */}
        {hazir && depo.cizimler.length === 0 && (
          <section className="clay p-7 text-center">
            <div className="salin mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[22px] bg-gk1/20 text-gk1">
              <Ikon ad="cerceve" boyut={38} />
            </div>
            <h2 className="mb-2 text-xl text-ink">Duvarlar bomboş</h2>
            <p className="mb-5 text-sm font-semibold text-inksoft">
              İlk çizimini yaptığında burada altın çerçevede asılı duracak.
            </p>
            <Link href="/ciz" className="clay-btn w-full">
              <Ikon ad="kalem" boyut={20} />
              İlk çizimini yap
            </Link>
          </section>
        )}

        {/* ---------- Galeri ---------- */}
        {hazir && depo.cizimler.length > 0 && (
          <ul className="grid grid-cols-2 gap-3.5">
            {depo.cizimler.map((c, i) => (
              <li
                key={c.id}
                className={`cerceve cerceve-n${cerceveNo(c.id)} belir`}
                style={{ "--i": i } as React.CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => setAcikId(c.id)}
                  className="block w-full cursor-pointer text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.veri}
                    alt={c.baslik}
                    className="aspect-square w-full rounded-[12px] bg-white object-cover"
                  />
                </button>

                <div className="mt-2 flex items-center gap-1.5 px-0.5">
                  <span className="min-w-0 flex-1 truncate font-display text-[15px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
                    {c.baslik}
                  </span>
                  <span className="relative">
                    {ucan?.id === c.id && (
                      <span key={ucan.n} aria-hidden="true" className="kalp-uc text-pembe">
                        <Ikon ad="kalp" boyut={22} dolu />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => kalpVer(c.id)}
                      aria-label={`${c.baslik} çizimine kalp ver. Şu an ${c.kalp} kalp.`}
                      className="flex h-9 min-w-9 cursor-pointer items-center gap-1 rounded-full bg-white/85 px-2 text-[13px] font-extrabold text-pembe transition-transform duration-200 active:scale-90"
                    >
                      <Ikon
                        ad="kalp"
                        boyut={15}
                        dolu={c.kalp > 0}
                        className={ucan?.id === c.id ? "kalp-zipla" : undefined}
                      />
                      {c.kalp > 0 && <span className="tabular-nums">{c.kalp}</span>}
                    </button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* ---------- Tek çizim görünümü ---------- */}
      {acik && (
        <div
          className="fon-ac fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-3 backdrop-blur-sm sm:items-center"
          onClick={kapat}
          role="dialog"
          aria-modal="true"
          aria-label={`${acik.baslik} çizimi`}
        >
          <div
            className="clay pencere-ac max-h-[92dvh] w-full max-w-md overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`cerceve cerceve-n${cerceveNo(acik.id)} mb-4`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={acik.veri}
                alt={acik.baslik}
                className="w-full rounded-[12px] bg-white"
              />
            </div>

            <label
              htmlFor="ad-degistir"
              className="mb-2 block text-[12px] font-bold uppercase tracking-[0.1em] text-inksoft"
            >
              Çizimin adı
            </label>
            <input
              id="ad-degistir"
              className="clay-input mb-3"
              value={acik.baslik}
              onChange={(e) => cizimAdiDegistir(acik.id, e.target.value)}
              maxLength={40}
            />

            <p className="mb-4 text-sm font-semibold text-inksoft">
              {tarihYaz(acik.tarih)}
              {acik.gorev && (
                <>
                  {" · "}
                  <span className="italic">{acik.gorev}</span>
                </>
              )}
            </p>

            {!silOnay ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => indir(acik.veri, acik.baslik)}
                  className="clay-btn kucuk beyaz flex-1"
                >
                  <Ikon ad="indir" boyut={18} />
                  İndir
                </button>
                <button
                  type="button"
                  onClick={() => setSilOnay(true)}
                  className="clay-btn kucuk beyaz"
                  aria-label="Bu çizimi sil"
                >
                  <Ikon ad="cop" boyut={18} />
                </button>
                <button type="button" onClick={kapat} className="clay-btn kucuk flex-1">
                  Kapat
                </button>
              </div>
            ) : (
              <div className="clay-soft p-3">
                <p className="mb-3 text-center text-sm font-bold text-ink">
                  Bu çizim müzeden kaldırılsın mı? Geri getirilemez.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSilOnay(false)}
                    className="clay-btn kucuk beyaz flex-1"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      cizimSil(acik.id);
                      kapat();
                    }}
                    className="clay-btn kucuk pembe flex-1"
                  >
                    Evet, sil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <AltMenu />
    </>
  );
}
