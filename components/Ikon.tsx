/* ============================================================
   İKONLAR
   Emoji değil, gerçek SVG — her boyutta net görünür ve
   ekran okuyucular için doğru etiketlenebilir.
   Çizgi kalınlığı 2.2px: çocuk arayüzünde ikonlar dolgun durmalı.
   ============================================================ */

export type IkonAdi =
  | "ev"
  | "palet"
  | "cerceve"
  | "kitap"
  | "kalp"
  | "geri"
  | "arti"
  | "cop"
  | "onay"
  | "geriAl"
  | "silgi"
  | "yildiz"
  | "kalem"
  | "indir"
  | "sol"
  | "sag";

const YOLLAR: Record<IkonAdi, React.ReactNode> = {
  ev: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </>
  ),
  palet: (
    <>
      <path d="M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.5-1.1-1.7-1.1-2.7 0-.8.7-1.5 1.6-1.5H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7Z" />
      <circle cx="7.8" cy="11.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7.8" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="9" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  cerceve: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M3 16l4.5-4.5a2 2 0 0 1 2.8 0L15 16" />
      <path d="M14 14.5l1.6-1.6a2 2 0 0 1 2.8 0L21 15.5" />
      <circle cx="8.8" cy="8.3" r="1.4" />
    </>
  ),
  kitap: (
    <>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5Z" />
      <path d="M4 19.5A1.5 1.5 0 0 1 5.5 21H19v-3" />
      <path d="M8.5 7.5h6.5M8.5 11h5" />
    </>
  ),
  kalp: (
    <path d="M12 20s-7-4.4-7-9.3A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.7c0 4.9-7 9.3-7 9.3Z" />
  ),
  geri: (
    <>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </>
  ),
  arti: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  cop: (
    <>
      <path d="M4 7h16" />
      <path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
      <path d="M6.5 7l.9 12.1A1.5 1.5 0 0 0 8.9 20.5h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </>
  ),
  onay: <path d="M4.5 12.5l5 5 10-11" />,
  geriAl: (
    <>
      <path d="M4 8.5h9.5a5.5 5.5 0 0 1 0 11H8" />
      <path d="M7.5 4.5 3.5 8.5l4 4" />
    </>
  ),
  silgi: (
    <>
      <path d="M8.4 20.5H20" />
      <path d="M15.8 4.4 4.6 15.6a1.9 1.9 0 0 0 0 2.7l2.2 2.2h4.4l9.2-9.2a1.9 1.9 0 0 0 0-2.7l-2-2a1.9 1.9 0 0 0-2.6 0Z" />
      <path d="M10 10.2 16.8 17" />
    </>
  ),
  yildiz: (
    <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9L3.5 9.7l5.9-.8Z" />
  ),
  kalem: (
    <>
      <path d="M15.2 4.6 19.4 8.8" />
      <path d="M17.3 2.5a1.9 1.9 0 0 1 2.7 0l1.5 1.5a1.9 1.9 0 0 1 0 2.7L8.6 20.1 3 21l.9-5.6Z" />
    </>
  ),
  indir: (
    <>
      <path d="M12 3.5v11" />
      <path d="M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  sol: <path d="M14.5 5.5 8 12l6.5 6.5" />,
  sag: <path d="M9.5 5.5 16 12l-6.5 6.5" />,
};

export default function Ikon({
  ad,
  boyut = 24,
  className = "",
  dolu = false,
}: {
  ad: IkonAdi;
  boyut?: number;
  className?: string;
  /** Kalp gibi ikonlarda içi dolsun mu */
  dolu?: boolean;
}) {
  return (
    <svg
      width={boyut}
      height={boyut}
      viewBox="0 0 24 24"
      fill={dolu ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {YOLLAR[ad]}
    </svg>
  );
}
