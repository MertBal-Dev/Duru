"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Ikon, { type IkonAdi } from "./Ikon";

/* Alt menü — 4 bölüm (kılavuz: en fazla 5).
   Her düğme 44x44'ten büyük, aralarında boşluk var:
   tablette parmakla yanlışlıkla başka yere basılmasın. */

const BOLUMLER: { yol: string; ad: string; ikon: IkonAdi }[] = [
  { yol: "/", ad: "Atölye", ikon: "ev" },
  { yol: "/ciz", ad: "Çiz", ikon: "palet" },
  { yol: "/muze", ad: "Müze", ikon: "cerceve" },
  { yol: "/kitaplik", ad: "Kitaplar", ikon: "kitap" },
  { yol: "/ben", ad: "Ben", ikon: "yildiz" },
];

export default function AltMenu() {
  const yol = usePathname();

  return (
    <nav
      aria-label="Ana bölümler"
      className="sticky bottom-0 z-30 mt-auto px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
    >
      <ul className="clay mx-auto flex max-w-lg items-stretch gap-2 p-2">
        {BOLUMLER.map((b) => {
          const aktif = yol === b.yol || (b.yol !== "/" && yol.startsWith(b.yol));
          return (
            <li key={b.yol} className="flex-1">
              <Link
                href={b.yol}
                aria-current={aktif ? "page" : undefined}
                className={[
                  "flex min-h-[56px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[16px] px-1 py-2",
                  "font-display text-[13px] font-bold transition-all duration-200",
                  aktif
                    ? "bg-mor text-white shadow-[0_4px_0_rgba(46,16,101,0.25)]"
                    : "text-inksoft hover:bg-surface2 hover:text-mor",
                ].join(" ")}
              >
                <Ikon ad={b.ikon} boyut={23} />
                <span>{b.ad}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
