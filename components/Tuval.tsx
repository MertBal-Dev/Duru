"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Ikon from "./Ikon";

/* ============================================================
   ÇİZİM TUVALİ
   - Parmak, kalem ve fare ile çalışır (Pointer Events)
   - Yüksek çözünürlüklü ekranlarda net (devicePixelRatio)
   - Geri al: çizgiler listede tutulur, geri alınca yeniden çizilir
   ============================================================ */

type Nokta = { x: number; y: number };
type Cizgi = { renk: string; kalinlik: number; silgi: boolean; noktalar: Nokta[] };

const RENKLER = [
  "#2E1065", "#111827", "#FF6FA5", "#EC4899",
  "#FF9A6B", "#FFC93C", "#4FD1A5", "#16A34A",
  "#58BEF0", "#2563EB", "#A97BFF", "#7C3AED",
  "#8B5A2B", "#F9A8D4", "#FFFFFF", "#94A3B8",
];

const KALINLIKLAR = [4, 10, 20, 34];

/** Kaydedilen resmin kenar uzunluğu — tarayıcı hafızasını şişirmemek için sınırlı */
const KAYIT_BOYUTU = 800;

export default function Tuval({
  onKaydet,
  kaydediliyor = false,
}: {
  onKaydet: (veri: string) => void;
  kaydediliyor?: boolean;
}) {
  const tuvalRef = useRef<HTMLCanvasElement>(null);
  const sarmalRef = useRef<HTMLDivElement>(null);
  const cizgilerRef = useRef<Cizgi[]>([]);
  const aktifRef = useRef<Cizgi | null>(null);
  const olcuRef = useRef(1);

  const [renk, setRenk] = useState("#2E1065");
  const [kalinlik, setKalinlik] = useState(10);
  const [silgi, setSilgi] = useState(false);
  const [bosMu, setBosMu] = useState(true);

  /* --- tuvali baştan çiz --- */
  const yenidenCiz = useCallback(() => {
    const c = tuvalRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const o = olcuRef.current;
    ctx.setTransform(o, 0, 0, o, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width / o, c.height / o);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const cz of cizgilerRef.current) cizgiCiz(ctx, cz);
  }, []);

  /* --- tek bir çizgiyi çiz (orta noktalardan yumuşatarak) --- */
  function cizgiCiz(ctx: CanvasRenderingContext2D, cz: Cizgi) {
    const n = cz.noktalar;
    if (n.length === 0) return;
    ctx.strokeStyle = cz.silgi ? "#ffffff" : cz.renk;
    ctx.lineWidth = cz.kalinlik;
    ctx.beginPath();

    if (n.length === 1) {
      ctx.arc(n[0].x, n[0].y, cz.kalinlik / 2, 0, Math.PI * 2);
      ctx.fillStyle = cz.silgi ? "#ffffff" : cz.renk;
      ctx.fill();
      return;
    }

    ctx.moveTo(n[0].x, n[0].y);
    for (let i = 1; i < n.length - 1; i++) {
      const orta = { x: (n[i].x + n[i + 1].x) / 2, y: (n[i].y + n[i + 1].y) / 2 };
      ctx.quadraticCurveTo(n[i].x, n[i].y, orta.x, orta.y);
    }
    ctx.lineTo(n[n.length - 1].x, n[n.length - 1].y);
    ctx.stroke();
  }

  /* --- boyutlandırma: kare tuval, ekran yoğunluğuna göre net --- */
  useEffect(() => {
    const boyutla = () => {
      const c = tuvalRef.current;
      const s = sarmalRef.current;
      if (!c || !s) return;
      const en = s.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      olcuRef.current = dpr;
      c.style.width = `${en}px`;
      c.style.height = `${en}px`;
      c.width = Math.round(en * dpr);
      c.height = Math.round(en * dpr);
      yenidenCiz();
    };
    boyutla();
    const g = new ResizeObserver(boyutla);
    if (sarmalRef.current) g.observe(sarmalRef.current);
    return () => g.disconnect();
  }, [yenidenCiz]);

  /* --- konum: ekran koordinatını tuval koordinatına çevir --- */
  function konum(e: React.PointerEvent<HTMLCanvasElement>): Nokta {
    const c = tuvalRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function bas(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    aktifRef.current = { renk, kalinlik, silgi, noktalar: [konum(e)] };
    cizgilerRef.current.push(aktifRef.current);
    setBosMu(false);
    yenidenCiz();
  }

  function kaydir(e: React.PointerEvent<HTMLCanvasElement>) {
    const a = aktifRef.current;
    if (!a) return;
    a.noktalar.push(konum(e));
    const ctx = tuvalRef.current?.getContext("2d");
    if (ctx) cizgiCiz(ctx, a);
  }

  function birak() {
    aktifRef.current = null;
  }

  function geriAl() {
    cizgilerRef.current.pop();
    setBosMu(cizgilerRef.current.length === 0);
    yenidenCiz();
  }

  function temizle() {
    cizgilerRef.current = [];
    setBosMu(true);
    yenidenCiz();
  }

  /* --- kaydet: sabit boyutlu PNG üret --- */
  function kaydet() {
    const kaynak = tuvalRef.current;
    if (!kaynak) return;
    const hedef = document.createElement("canvas");
    hedef.width = KAYIT_BOYUTU;
    hedef.height = KAYIT_BOYUTU;
    const ctx = hedef.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, KAYIT_BOYUTU, KAYIT_BOYUTU);
    ctx.drawImage(kaynak, 0, 0, KAYIT_BOYUTU, KAYIT_BOYUTU);
    onKaydet(hedef.toDataURL("image/png"));
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ---------- Tuval ---------- */}
      <div ref={sarmalRef} className="clay p-2.5">
        <canvas
          ref={tuvalRef}
          className="tuval w-full"
          onPointerDown={bas}
          onPointerMove={kaydir}
          onPointerUp={birak}
          onPointerCancel={birak}
          aria-label="Çizim alanı. Parmağınla veya kalemle çiz."
          role="img"
        />
      </div>

      {/* ---------- Renkler ---------- */}
      <div className="clay-soft p-3">
        <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.1em] text-inksoft">
          Renk seç
        </p>
        <div className="grid grid-cols-8 gap-2">
          {RENKLER.map((r) => {
            const secili = renk === r && !silgi;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRenk(r);
                  setSilgi(false);
                }}
                aria-label={`Renk ${r}`}
                aria-pressed={secili}
                className={[
                  "aspect-square w-full cursor-pointer rounded-full transition-transform duration-200",
                  "border-[3px] shadow-[0_3px_0_rgba(46,16,101,0.18)]",
                  secili
                    ? "scale-110 border-ink"
                    : "border-white hover:scale-105",
                ].join(" ")}
                style={{ background: r }}
              />
            );
          })}
        </div>
      </div>

      {/* ---------- Fırça, silgi, geri al ---------- */}
      <div className="clay-soft flex flex-wrap items-center gap-2 p-3">
        <div className="flex items-center gap-1.5" role="group" aria-label="Fırça kalınlığı">
          {KALINLIKLAR.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKalinlik(k)}
              aria-label={`Fırça kalınlığı ${k}`}
              aria-pressed={kalinlik === k}
              className={[
                "flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-[14px] border-[3px] transition-all duration-200",
                kalinlik === k
                  ? "border-mor bg-white"
                  : "border-transparent bg-white/60 hover:bg-white",
              ].join(" ")}
            >
              <span
                className="rounded-full bg-ink"
                style={{ width: k / 1.6 + 6, height: k / 1.6 + 6 }}
              />
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSilgi((s) => !s)}
            aria-pressed={silgi}
            className={`clay-btn kucuk ${silgi ? "" : "beyaz"}`}
          >
            <Ikon ad="silgi" boyut={19} />
            <span className="gizli-metin">Silgi</span>
          </button>

          <button
            type="button"
            onClick={geriAl}
            disabled={bosMu}
            className="clay-btn kucuk beyaz"
          >
            <Ikon ad="geriAl" boyut={19} />
            <span className="gizli-metin">Geri al</span>
          </button>

          <button
            type="button"
            onClick={temizle}
            disabled={bosMu}
            className="clay-btn kucuk beyaz"
          >
            <Ikon ad="cop" boyut={19} />
            <span className="gizli-metin">Hepsini sil</span>
          </button>
        </div>
      </div>

      {/* ---------- Kaydet ---------- */}
      <button
        type="button"
        onClick={kaydet}
        disabled={bosMu || kaydediliyor}
        className="clay-btn pembe w-full"
      >
        <Ikon ad="onay" boyut={21} />
        {kaydediliyor ? "Çerçeveleniyor…" : "Müzeye as!"}
      </button>

      {bosMu && (
        <p className="text-center text-sm font-semibold text-inksoft">
          Çizmeye başlayınca kaydet düğmesi açılacak.
        </p>
      )}
    </div>
  );
}
