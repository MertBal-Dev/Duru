"use client";

import { useMemo } from "react";

/* ============================================================
   KARŞILAMA SAHNESİ
   Unicorn, yıldızlar, bulutlar ve gökkuşağı — hepsi SVG/CSS.
   Görsel dosyası yok: her ekran boyutunda net, anında yükleniyor
   ve hareket ediyor.
   ============================================================ */

const YAL_RENKLERI = ["#F2506E", "#FF8FC0", "#FFC93C", "#B5D83F", "#58BEF0", "#A97BFF"];

/* --- Havada duran yıldızlar ve bulutlar (arka plan) --- */
export function Gokyuzu() {
  const yildizlar = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        sol: (i * 37 + 11) % 96,
        ust: (i * 53 + 7) % 62,
        boy: 3 + ((i * 7) % 5),
        sure: `${2.4 + ((i * 5) % 26) / 10}s`,
        gecikme: `${((i * 13) % 30) / 10}s`,
      })),
    [],
  );

  const bulutlar = useMemo(
    () => [
      { sol: -6, ust: 8, en: 150, boy: 46, sure: "30s", gecikme: "0s", opak: 0.75 },
      { sol: 62, ust: 4, en: 190, boy: 54, sure: "38s", gecikme: "-8s", opak: 0.6 },
      { sol: 18, ust: 26, en: 120, boy: 36, sure: "34s", gecikme: "-16s", opak: 0.5 },
    ],
    [],
  );

  return (
    <div className="gokyuzu" aria-hidden="true">
      {bulutlar.map((b, i) => (
        <span
          key={`b${i}`}
          className="bulut"
          style={
            {
              left: `${b.sol}%`,
              top: `${b.ust}%`,
              width: b.en,
              height: b.boy,
              opacity: b.opak,
              "--sure": b.sure,
              "--gecikme": b.gecikme,
            } as React.CSSProperties
          }
        />
      ))}
      {yildizlar.map((y, i) => (
        <span
          key={`y${i}`}
          className="yildiz"
          style={
            {
              left: `${y.sol}%`,
              top: `${y.ust}%`,
              width: y.boy,
              height: y.boy,
              "--sure": y.sure,
              "--gecikme": y.gecikme,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* --- Unicorn --- */
export function Unicorn({ boyut = 210 }: { boyut?: number }) {
  const pirltilar = [
    { sol: "4%", ust: "24%", boy: 15, sure: "3.2s", gecikme: "0s" },
    { sol: "88%", ust: "16%", boy: 12, sure: "3.8s", gecikme: "0.9s" },
    { sol: "78%", ust: "68%", boy: 17, sure: "3.4s", gecikme: "1.7s" },
    { sol: "12%", ust: "74%", boy: 11, sure: "4.1s", gecikme: "2.4s" },
  ];

  return (
    <div
      className="relative"
      style={{ width: boyut, height: boyut }}
      role="img"
      aria-label="Gökkuşağı yeleli bir unicorn"
    >
      {/* Pırıltılar */}
      {pirltilar.map((p, i) => (
        <span
          key={i}
          className="pirilti"
          style={
            {
              left: p.sol,
              top: p.ust,
              "--sure": p.sure,
              "--gecikme": p.gecikme,
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          <svg width={p.boy} height={p.boy} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l2.2 6.4L20.6 12l-6.4 2.2L12 20.6 9.8 14.2 3.4 12l6.4-3.6z"
              fill="#FFC93C"
            />
          </svg>
        </span>
      ))}

      <svg viewBox="0 0 240 240" className="unicorn h-full w-full">
        <defs>
          <radialGradient id="uBas" cx="38%" cy="30%" r="78%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#F6EDFF" />
          </radialGradient>
          <linearGradient id="uBoynuz" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#FFB63C" />
            <stop offset="100%" stopColor="#FFE79A" />
          </linearGradient>
        </defs>

        {/* Boynuz ışıması */}
        <circle
          className="boynuz-isik"
          cx="120"
          cy="42"
          r="26"
          fill="#FFE79A"
          opacity="0.5"
        />

        {/* Yele — gökkuşağı şeritleri, dalgalanıyor */}
        <g className="yal">
          {YAL_RENKLERI.map((r, i) => (
            <path
              key={r}
              d={`M ${168 - i * 4} ${96 + i * 9}
                  q 34 ${10 + i * 3} 26 ${40 + i * 6}
                  q -6 ${26 + i * 3} -34 ${28 + i * 2}`}
              fill="none"
              stroke={r}
              strokeWidth="13"
              strokeLinecap="round"
              opacity={0.95}
            />
          ))}
        </g>

        {/* Boyun */}
        <path
          d="M96 150 q6 44 26 62 q26 22 54 12 q-30 -6 -40 -34 q-8 -22 -6 -44 z"
          fill="url(#uBas)"
        />

        {/* Baş */}
        <path
          d="M84 118
             q-4 -32 18 -50
             q22 -18 46 -8
             q26 10 30 40
             q4 30 -16 46
             q-22 18 -46 10
             q-28 -10 -32 -38 z"
          fill="url(#uBas)"
        />

        {/* Burun ucu */}
        <path
          d="M70 132 q-14 8 -12 24 q2 16 18 18 q14 2 20 -10 l-6 -30 z"
          fill="url(#uBas)"
        />
        <ellipse cx="70" cy="156" rx="4.5" ry="3.2" fill="#D8B5E8" />

        {/* Kulak */}
        <path d="M150 74 q10 -22 24 -18 q6 14 -6 30 z" fill="#F3E7FF" />

        {/* Boynuz — sarmal */}
        <path d="M118 78 L128 26 L140 78 z" fill="url(#uBoynuz)" />
        <path
          d="M121 66 L136 62 M123 56 L134 52 M125 46 L132 43"
          stroke="#E89A1F"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Kapalı mutlu gözler */}
        <path
          d="M96 132 q10 -11 21 -1"
          stroke="#2E1065"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Yanak allığı */}
        <ellipse cx="92" cy="152" rx="12" ry="8" fill="#FF9EC4" opacity="0.55" />

        {/* Kirpikler */}
        <path
          d="M118 124 l7 -5 M124 130 l8 -3"
          stroke="#2E1065"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* --- Başlığın arkasındaki gökkuşağı yayı --- */
export function GokkusagiYay() {
  return (
    <svg
      className="gokkusagi-yay pointer-events-none absolute left-1/2 top-[58%] w-[150%] max-w-none -translate-x-1/2 -translate-y-1/2"
      viewBox="0 0 400 200"
      aria-hidden="true"
    >
      {["#F2506E", "#FF8FC0", "#FFC93C", "#B5D83F", "#58BEF0", "#A97BFF"].map((r, i) => (
        <path
          key={r}
          d={`M ${28 + i * 11} 190 a ${172 - i * 11} ${172 - i * 11} 0 0 1 ${344 - i * 22} 0`}
          fill="none"
          stroke={r}
          strokeWidth="8"
          strokeLinecap="round"
          /* Unicorn'un önüne çıkmasın diye soluk: dekor, kahraman değil */
          opacity={0.2}
        />
      ))}
    </svg>
  );
}
