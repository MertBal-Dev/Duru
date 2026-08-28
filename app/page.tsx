"use client";

import Link from "next/link";
import Image from "next/image";
import Ikon from "@/components/Ikon";
import AltMenu from "@/components/AltMenu";
import { cerceveNo, seri, useDepo } from "@/lib/depo";
import { gununGorevi } from "@/lib/gorevler";

export default function Atolye() {
  const { depo, hazir } = useDepo();
  const gorev = gununGorevi();
  const gunSeri = seri(depo.gunler);
  const sonCizimler = depo.cizimler.slice(0, 6);

  return (
    <>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-6 pb-4">
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
            <h1 className="truncate text-[27px] text-ink">
              {hazir ? depo.isim : " "}
            </h1>
          </div>
          {gunSeri > 0 && (
            <div className="clay-soft flex shrink-0 items-center gap-1.5 px-3 py-2">
              <Ikon ad="yildiz" boyut={19} dolu className="text-gk3" />
              <span className="font-display text-lg font-extrabold tabular-nums text-ink">
                {gunSeri}
              </span>
              <span className="text-[11px] font-bold leading-3 text-inksoft">
                gün
                <br />
                seri
              </span>
            </div>
          )}
        </header>

        {/* ---------- Bugünün görevi ---------- */}
        <section className="clay relative mb-4 overflow-hidden p-5">
          {/* Dekoratif renk lekeleri — içerik değil, ekran okuyucudan gizli */}
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

          {hazir && depo.gunler[new Date().toISOString().slice(0, 10)] && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-bold text-basari">
              <Ikon ad="onay" boyut={17} />
              Bugünkü çizimini yaptın!
            </p>
          )}
        </section>

        {/* ---------- İki kapı: Müze ve Kitaplık ---------- */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Link
            href="/muze"
            className="clay group flex cursor-pointer flex-col gap-2 p-4 transition-transform duration-200 active:translate-y-1"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gk1/15 text-gk1">
              <Ikon ad="cerceve" boyut={24} />
            </span>
            <span className="font-display text-lg font-bold text-ink">Müzem</span>
            <span className="text-sm font-semibold text-inksoft">
              {hazir ? `${depo.cizimler.length} çizim` : "…"}
            </span>
          </Link>

          <Link
            href="/kitaplik"
            className="clay group flex cursor-pointer flex-col gap-2 p-4 transition-transform duration-200 active:translate-y-1"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gk5/15 text-gk5">
              <Ikon ad="kitap" boyut={24} />
            </span>
            <span className="font-display text-lg font-bold text-ink">Kitaplarım</span>
            <span className="text-sm font-semibold text-inksoft">
              {hazir ? `${depo.kitaplar.length} kitap` : "…"}
            </span>
          </Link>
        </div>

        {/* ---------- Son çizimler ---------- */}
        {hazir && sonCizimler.length > 0 && (
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
                      src={c.veri}
                      alt={c.baslik || "Çizim"}
                      className="aspect-square w-full rounded-[10px] bg-white object-cover"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- İlk kez giriliyorsa yol göster ---------- */}
        {hazir && depo.cizimler.length === 0 && (
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
