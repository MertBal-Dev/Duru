"use client";

import { useMemo } from "react";

/* ============================================================
   KONFETİ
   Saf CSS — her parça kendi süresi, gecikmesi ve dönüşüyle düşer.
   Sadece kullanıcı bir şey yaptıktan sonra bağlanır, o yüzden
   Math.random() sunucu/tarayıcı uyumsuzluğu yaratmaz.
   ============================================================ */

const RENKLER = [
  "#FF6FA5", "#FF9A6B", "#FFC93C",
  "#4FD1A5", "#58BEF0", "#A97BFF", "#EC4899",
];

/* Kare, daire ve şerit karışık düşsün — hepsi aynı olursa yapay duruyor */
const SEKILLER = ["50%", "3px", "2px"] as const;

export default function Konfeti({ adet = 46 }: { adet?: number }) {
  const parcalar = useMemo(
    () =>
      Array.from({ length: adet }, (_, i) => {
        const en = 7 + Math.random() * 8;
        const serit = i % 3 === 2;
        return {
          sol: Math.random() * 100,
          en,
          boy: serit ? en * 2.4 : en,
          renk: RENKLER[i % RENKLER.length],
          sekil: SEKILLER[i % SEKILLER.length],
          sure: `${1500 + Math.random() * 1100}ms`,
          gecikme: `${Math.random() * 450}ms`,
          donus: `${Math.random() * 900 - 450}deg`,
          kayma: `${Math.random() * 160 - 80}px`,
        };
      }),
    [adet],
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      {parcalar.map((p, i) => (
        <span
          key={i}
          className="konfeti-parca"
          style={
            {
              left: `${p.sol}%`,
              width: p.en,
              height: p.boy,
              background: p.renk,
              borderRadius: p.sekil,
              "--sure": p.sure,
              "--gecikme": p.gecikme,
              "--donus": p.donus,
              "--kayma": p.kayma,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
