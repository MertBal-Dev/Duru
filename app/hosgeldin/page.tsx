"use client";

import Link from "next/link";
import Ikon from "@/components/Ikon";
import Baslik from "@/components/Baslik";
import { Gokyuzu, Unicorn, GokkusagiYay } from "@/components/Sahne";

/* ============================================================
   KARŞILAMA SAYFASI
   Kılavuzdaki "Hero-Centric" kalıbı: tam genişlikte bir kahraman
   bölüm (görsel + başlık), altında tek satırlık değer önerisi,
   sonra üç fayda ve TEK baskın çağrı düğmesi.
   ============================================================ */

const OZELLIKLER: {
  ikon: Parameters<typeof Ikon>[0]["ad"];
  ad: string;
  not: string;
  renk: string;
}[] = [
  { ikon: "palet", ad: "Çiz", not: "Her gün yeni bir görev", renk: "#F2506E" },
  { ikon: "cerceve", ad: "Müzene as", not: "Gökkuşağı çerçevelerde", renk: "#FFC93C" },
  { ikon: "kitap", ad: "Kitabını yaz", not: "Resimlerini de sen çiz", renk: "#58BEF0" },
];

export default function Hosgeldin() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <Gokyuzu />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-8">
        {/* ---------- KAHRAMAN BÖLÜM ---------- */}
        <section className="relative flex flex-col items-center">
          {/* Başlığın ve unicorn'un arkasındaki gökkuşağı yayı */}
          <div className="relative flex w-full justify-center">
            <GokkusagiYay />
            <div className="relative">
              <Unicorn boyut={196} />
            </div>
          </div>

          <div className="relative -mt-2 flex w-full justify-center">
            <Baslik />
          </div>

          <p className="mt-3 text-center text-[16px] font-semibold leading-relaxed text-inksoft">
            Çizimlerin altın çerçevede,
            <br />
            hikâyelerin kendi kitabında.
          </p>
        </section>

        {/* ---------- ÜÇ FAYDA ---------- */}
        <ul className="mt-7 flex flex-col gap-2.5">
          {OZELLIKLER.map((o, i) => (
            <li
              key={o.ad}
              className="clay belir flex items-center gap-3.5 p-3.5"
              style={{ "--i": i } as React.CSSProperties}
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]"
                style={{
                  background: `color-mix(in srgb, ${o.renk} 20%, white)`,
                  color: o.renk,
                }}
              >
                <Ikon ad={o.ikon} boyut={24} />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-lg font-bold text-ink">
                  {o.ad}
                </span>
                <span className="block text-sm font-semibold text-inksoft">{o.not}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* ---------- TEK BASKIN ÇAĞRI ----------
            Mor zemin + beyaz yazı 5.8:1 kontrast (pembe 3.3:1'de kalıyordu). */}
        <div className="mt-7">
          <Link href="/giris?kip=kayit" className="clay-btn w-full !text-[19px]">
            <Ikon ad="yildiz" boyut={21} dolu />
            Hadi başlayalım!
          </Link>

          <Link
            href="/giris"
            className="mx-auto mt-3.5 flex w-fit items-center gap-1.5 rounded-[12px] px-3 py-2 text-[15px] font-bold text-mor underline underline-offset-4"
          >
            Zaten hesabım var
          </Link>
        </div>

        <p className="mt-6 text-center text-[13px] font-semibold text-inksoft">
          Çizimlerin sadece sana ait. Kimse göremez.
        </p>
      </div>
    </main>
  );
}
