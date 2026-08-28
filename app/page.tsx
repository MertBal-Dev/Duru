"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Ikon from "@/components/Ikon";
import AltMenu from "@/components/AltMenu";
import Konfeti from "@/components/Konfeti";
import IndirButonu from "@/components/IndirButonu";
import { cerceveNo, useAtolye } from "@/lib/atolye";
import { gununGorevi } from "@/lib/gorevler";

/* Seri bu sayılara ulaşınca konfeti at — her gün değil, hak edince */
const DONUM_NOKTALARI = [3, 7, 14, 21, 30, 50, 75, 100];

export default function Atolye() {
  const { isim, cizimler, kitaplar, seri, bugunYapildi, hata } = useAtolye();
  const gorev = gununGorevi();
  const sonCizimler = cizimler.slice(0, 6);

  const [kutla, setKutla] = useState(false);
  const [gorulenSeri, setGorulenSeri] = useState<number | null>(null);

  /* Seri bu oturumda arttıysa kutla. Kalıcı bir yere yazmıyoruz —
     tek kaynak veritabanı, bu sadece anlık bir arayüz efekti. */
  useEffect(() => {
    if (seri < 1) return;
    if (gorulenSeri === null) {
      setGorulenSeri(seri);
      return;
    }
    if (seri > gorulenSeri) {
      setGorulenSeri(seri);
      setKutla(true);
      const z = setTimeout(() => setKutla(false), 2600);
      return () => clearTimeout(z);
    }
  }, [seri, gorulenSeri]);

  const donumNoktasi = kutla && DONUM_NOKTALARI.includes(seri);

  return (
    <>
      {donumNoktasi && <Konfeti adet={54} />}
      <main className="giris mx-auto w-full max-w-lg flex-1 px-4 pt-6 pb-4">
        {/* ---------- Selamlama ---------- */}
        <header className="mb-5 flex items-center gap-3">
          <div className="clay flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden !p-0">
            <Image
              src="/logo.png"
              alt="Duru'nun Atölyesi"
              width={112}
              height={112}
              priority
              className="h-full w-full scale-[1.12] object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-inksoft">
              Merhaba
            </p>
            <h1 className="truncate text-[27px] text-ink">{isim}</h1>
          </div>
          {seri > 0 && (
            <div
              className={`clay-soft flex shrink-0 items-center gap-1.5 rounded-[16px] px-3 py-2 ${
                kutla ? "seri-parla" : ""
              }`}
            >
              <Ikon ad="yildiz" boyut={19} dolu className="text-gk3" />
              <span className="font-display text-lg font-extrabold tabular-nums text-ink">
                {seri}
              </span>
              <span className="text-[11px] font-bold leading-3 text-inksoft">
                gün
                <br />
                seri
              </span>
            </div>
          )}
        </header>

        {hata && (
          <p
            role="alert"
            className="mb-4 rounded-[14px] border-[3px] border-uyari/30 bg-uyari/10 p-3 text-sm font-bold text-uyari"
          >
            {hata}
          </p>
        )}

        {/* ---------- Bugünün görevi ---------- */}
        <section className="clay relative mb-4 overflow-hidden p-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gk1 opacity-20 blur-xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-gk5 opacity-20 blur-xl"
          />

          <p className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-pembe">
            <Ikon ad="palet" boyut={17} />
            Bugünün görevi
          </p>

          <p className="font-display text-[25px] font-bold leading-[1.2] text-ink">
            {gorev}
          </p>

          <Link
            href="/ciz"
            className="clay-btn mt-5 w-full"
            aria-label="Bugünün görevini çizmeye başla"
          >
            <Ikon ad="kalem" boyut={21} />
            Çizmeye başla
          </Link>

          {bugunYapildi && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-bold text-basari">
              <Ikon ad="onay" boyut={17} />
              Bugünkü çizimini yaptın!
            </p>
          )}
        </section>

        {/* ---------- İki kapı ---------- */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Link
            href="/muze"
            className="clay flex cursor-pointer flex-col gap-2 p-4 transition-transform duration-200 active:translate-y-1"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gk1/15 text-gk1">
              <Ikon ad="cerceve" boyut={24} />
            </span>
            <span className="font-display text-lg font-bold text-ink">Müzem</span>
            <span className="text-sm font-semibold text-inksoft">
              {cizimler.length} çizim
            </span>
          </Link>

          <Link
            href="/kitaplik"
            className="clay flex cursor-pointer flex-col gap-2 p-4 transition-transform duration-200 active:translate-y-1"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gk5/15 text-gk5">
              <Ikon ad="kitap" boyut={24} />
            </span>
            <span className="font-display text-lg font-bold text-ink">Kitaplarım</span>
            <span className="text-sm font-semibold text-inksoft">
              {kitaplar.length} kitap
            </span>
          </Link>
        </div>

        <IndirButonu />

        {/* ---------- Son çizimler ---------- */}
        {sonCizimler.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center justify-between text-lg text-ink">
              Son çizimlerin
              <Link
                href="/muze"
                className="font-body text-sm font-bold text-mor underline underline-offset-4"
              >
                hepsi
              </Link>
            </h2>
            <ul className="grid grid-cols-3 gap-2.5">
              {sonCizimler.map((c, i) => (
                <li
                  key={c.id}
                  className={`cerceve cerceve-n${cerceveNo(c.id)} belir !p-1.5`}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <Link href="/muze" className="block cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.url}
                      alt={c.baslik || "Çizim"}
                      className="aspect-square w-full rounded-[10px] bg-white object-cover"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- İlk kez ---------- */}
        {cizimler.length === 0 && (
          <section className="clay-soft mt-2 p-5 text-center">
            <div className="salin mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[20px] bg-gk3/25 text-gk3">
              <Ikon ad="palet" boyut={32} />
            </div>
            <h2 className="mb-1 text-xl text-ink">Atölyen bomboş!</h2>
            <p className="text-sm font-semibold text-inksoft">
              İlk çizimini yap, altın çerçeveye girsin ve müzende asılı kalsın.
            </p>
          </section>
        )}
      </main>

      <AltMenu />
    </>
  );
}
