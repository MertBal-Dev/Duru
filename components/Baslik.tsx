"use client";

import { useId } from "react";

/* ============================================================
   DURU'NUN ATÖLYESİ — kavisli gökkuşağı başlık

   Duru'nun çizimindeki gibi: "DURU" harfleri bir kavisin üstünde
   duruyor, her harf ayrı renkte, altlarında ince kavis çizgisi.

   Harfler SVG textPath ile gerçekten kavis boyunca diziliyor —
   döndürülmüş kutular değil, o yüzden her genişlikte düzgün.
   ============================================================ */

/* Renkler doğrudan Duru'nun çiziminden */
const HARFLER: { harf: string; renk: string }[] = [
  { harf: "D", renk: "#F2506E" },
  { harf: "U", renk: "#FF8FC0" },
  { harf: "R", renk: "#B5D83F" },
  { harf: "U", renk: "#58BEF0" },
];

export default function Baslik({
  boyut = "buyuk",
}: {
  boyut?: "buyuk" | "kucuk";
}) {
  const kimlik = useId().replace(/:/g, "");
  const kavisId = `kavis-${kimlik}`;
  const buyukMu = boyut === "buyuk";

  return (
    <div
      className={buyukMu ? "w-full max-w-[380px]" : "w-full max-w-[250px]"}
      role="img"
      aria-label="Duru'nun Atölyesi"
    >
      {/* viewBox harflere sıkı oturuyor — altta ölü boşluk kalmasın */}
      <svg viewBox="0 0 640 196" className="block w-full" aria-hidden="true">
        <defs>
          <path id={kavisId} d="M 78 176 Q 320 24 562 176" fill="none" />
        </defs>

        {/* İnce kavis — harfleri taşıyor, ayırmıyor */}
        <path
          d="M 74 186 Q 320 34 566 186"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.55"
        />

        <text
          style={{
            fontFamily: "var(--font-display), 'Trebuchet MS', sans-serif",
            fontWeight: 800,
            fontSize: "96px",
            letterSpacing: "12px",
          }}
        >
          <textPath href={`#${kavisId}`} startOffset="50%" textAnchor="middle">
            {HARFLER.map((h, i) => (
              <tspan key={i} fill={h.renk}>
                {h.harf}
              </tspan>
            ))}
          </textPath>
        </text>
      </svg>

      {/* Kesme işareti sahiplik ekini net gösteriyor: DURU'nun Atölyesi */}
      <p
        className={`-mt-3 text-center font-display font-bold leading-none text-ink ${
          buyukMu ? "text-[30px]" : "text-[21px]"
        }`}
      >
        &rsquo;nun Atölyesi
      </p>
    </div>
  );
}
