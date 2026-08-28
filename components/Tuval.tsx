"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Ikon from "./Ikon";

/* ============================================================
   ÇİZİM TUVALİ
   - Parmak, kalem ve fare (Pointer Events)
   - Kalem basıncına duyarlı çizgi kalınlığı
   - İki parmakla yakınlaştırma ve kaydırma
   - Tam ekran modu
   - Geri al / ileri al
   - Dolgu boyama ve damlalık
   - Taslak otomatik kaydedilir: sayfadan çıksa bile çizimi durur
   ============================================================ */

type Nokta = { x: number; y: number; b: number };

type Islem =
  | { tur: "cizgi"; renk: string; kalinlik: number; silgi: boolean; noktalar: Nokta[] }
  | { tur: "dolgu"; renk: string; x: number; y: number };

type Arac = "firca" | "silgi" | "dolgu" | "damlalik";

const RENKLER = [
  "#2E1065", "#111827", "#FF6FA5", "#EC4899",
  "#FF9A6B", "#FFC93C", "#4FD1A5", "#16A34A",
  "#58BEF0", "#2563EB", "#A97BFF", "#7C3AED",
  "#8B5A2B", "#F9A8D4", "#FFFFFF", "#94A3B8",
];

/* Hızlı seçim için hazır boyutlar — kaydırıcıyla da ince ayar yapılabilir */
const KALINLIKLAR: { boyut: number; ad: string }[] = [
  { boyut: 2, ad: "İnce çizgi" },
  { boyut: 10, ad: "Orta çizgi" },
  { boyut: 20, ad: "Kalın çizgi" },
  { boyut: 30, ad: "Çok kalın çizgi" },
];

const EN_INCE = 1;
const EN_KALIN = 30;
const KAYIT_BOYUTU = 800;
const IC_BOYUT = 1000; // tuvalin kendi koordinat sistemi
const TASLAK_ANAHTARI = "duru.atolye.taslak";

export default function Tuval({
  onKaydet,
  kaydediliyor = false,
}: {
  onKaydet: (veri: string) => void;
  kaydediliyor?: boolean;
}) {
  const tuvalRef = useRef<HTMLCanvasElement>(null);
  const sarmalRef = useRef<HTMLDivElement>(null);

  const islemlerRef = useRef<Islem[]>([]);
  const geriAlinanRef = useRef<Islem[]>([]);
  const aktifRef = useRef<Islem | null>(null);
  const parmaklarRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const jestRef = useRef<{ mesafe: number; olcek: number; orta: { x: number; y: number }; kaydirma: { x: number; y: number } } | null>(null);

  const [arac, setArac] = useState<Arac>("firca");
  const [renk, setRenk] = useState("#2E1065");
  const [kalinlik, setKalinlik] = useState(10);
  const [olcek, setOlcek] = useState(1);
  const [kaydirma, setKaydirma] = useState({ x: 0, y: 0 });
  const [tamEkran, setTamEkran] = useState(false);
  const [bosMu, setBosMu] = useState(true);
  const [ileriVar, setIleriVar] = useState(false);
  const [taslakGeriYuklendi, setTaslakGeriYuklendi] = useState(false);

  const olcekRef = useRef(olcek);
  const kaydirmaRef = useRef(kaydirma);
  olcekRef.current = olcek;
  kaydirmaRef.current = kaydirma;

  /* ---------- Çizim ---------- */

  const islemUygula = useCallback((ctx: CanvasRenderingContext2D, o: Islem) => {
    if (o.tur === "dolgu") {
      dolguYap(ctx, o.x, o.y, o.renk);
      return;
    }
    const n = o.noktalar;
    if (n.length === 0) return;
    ctx.strokeStyle = o.silgi ? "#ffffff" : o.renk;
    ctx.fillStyle = o.silgi ? "#ffffff" : o.renk;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (n.length === 1) {
      ctx.beginPath();
      ctx.arc(n[0].x, n[0].y, (o.kalinlik * n[0].b) / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    // Her parça kendi basıncıyla çizilir — kalem bastırınca çizgi kalınlaşır
    for (let i = 1; i < n.length; i++) {
      ctx.beginPath();
      ctx.lineWidth = Math.max(1, o.kalinlik * ((n[i - 1].b + n[i].b) / 2));
      ctx.moveTo(n[i - 1].x, n[i - 1].y);
      const orta = { x: (n[i - 1].x + n[i].x) / 2, y: (n[i - 1].y + n[i].y) / 2 };
      ctx.quadraticCurveTo(n[i - 1].x, n[i - 1].y, orta.x, orta.y);
      ctx.lineTo(n[i].x, n[i].y);
      ctx.stroke();
    }
  }, []);

  const yenidenCiz = useCallback(() => {
    const c = tuvalRef.current;
    if (!c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);

    const oran = c.width / IC_BOYUT;
    ctx.setTransform(oran, 0, 0, oran, 0, 0);
    for (const o of islemlerRef.current) islemUygula(ctx, o);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [islemUygula]);

  /* ---------- Dolgu boyama (tarama çizgisi yöntemi) ---------- */

  function dolguYap(ctx: CanvasRenderingContext2D, ix: number, iy: number, hedefRenk: string) {
    const c = ctx.canvas;
    const oran = c.width / IC_BOYUT;
    const x = Math.round(ix * oran);
    const y = Math.round(iy * oran);
    if (x < 0 || y < 0 || x >= c.width || y >= c.height) return;

    const onceki = ctx.getTransform();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const veri = ctx.getImageData(0, 0, c.width, c.height);
    const p = veri.data;
    const gen = c.width;

    const bas = (y * gen + x) * 4;
    const hedef = [p[bas], p[bas + 1], p[bas + 2]];
    const yeni = hexRgb(hedefRenk);
    if (Math.abs(hedef[0] - yeni[0]) < 6 && Math.abs(hedef[1] - yeni[1]) < 6 && Math.abs(hedef[2] - yeni[2]) < 6) {
      ctx.setTransform(onceki);
      return;
    }

    const esitMi = (i: number) =>
      Math.abs(p[i] - hedef[0]) < 34 &&
      Math.abs(p[i + 1] - hedef[1]) < 34 &&
      Math.abs(p[i + 2] - hedef[2]) < 34;

    const yigin = [[x, y]];
    while (yigin.length) {
      const [cx, cy] = yigin.pop()!;
      let sol = cx;
      while (sol > 0 && esitMi((cy * gen + sol - 1) * 4)) sol--;
      let sag = cx;
      while (sag < gen - 1 && esitMi((cy * gen + sag + 1) * 4)) sag++;

      for (let i = sol; i <= sag; i++) {
        const k = (cy * gen + i) * 4;
        p[k] = yeni[0]; p[k + 1] = yeni[1]; p[k + 2] = yeni[2]; p[k + 3] = 255;
        if (cy > 0 && esitMi(((cy - 1) * gen + i) * 4)) yigin.push([i, cy - 1]);
        if (cy < c.height - 1 && esitMi(((cy + 1) * gen + i) * 4)) yigin.push([i, cy + 1]);
      }
    }
    ctx.putImageData(veri, 0, 0);
    ctx.setTransform(onceki);
  }

  function hexRgb(h: string): [number, number, number] {
    const s = h.replace("#", "");
    return [
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16),
    ];
  }

  function rengiOku(ix: number, iy: number): string | null {
    const c = tuvalRef.current;
    const ctx = c?.getContext("2d", { willReadFrequently: true });
    if (!c || !ctx) return null;
    const oran = c.width / IC_BOYUT;
    const onceki = ctx.getTransform();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const d = ctx.getImageData(Math.round(ix * oran), Math.round(iy * oran), 1, 1).data;
    ctx.setTransform(onceki);
    return "#" + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
  }

  /* ---------- Boyutlandırma ---------- */

  useEffect(() => {
    const boyutla = () => {
      const c = tuvalRef.current;
      const s = sarmalRef.current;
      if (!c || !s) return;
      const en = s.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
  }, [yenidenCiz, tamEkran]);

  /* ---------- Taslak: sayfadan çıksa bile çizimi kaybolmasın ---------- */

  useEffect(() => {
    try {
      const ham = localStorage.getItem(TASLAK_ANAHTARI);
      if (!ham) return;
      const kayitli = JSON.parse(ham) as Islem[];
      if (Array.isArray(kayitli) && kayitli.length) {
        islemlerRef.current = kayitli;
        setBosMu(false);
        setTaslakGeriYuklendi(true);
        yenidenCiz();
      }
    } catch {
      /* bozuk taslak — yok say */
    }
  }, [yenidenCiz]);

  const taslakYaz = useCallback(() => {
    try {
      if (islemlerRef.current.length) {
        localStorage.setItem(TASLAK_ANAHTARI, JSON.stringify(islemlerRef.current));
      } else {
        localStorage.removeItem(TASLAK_ANAHTARI);
      }
    } catch {
      /* hafıza dolu — çizim ekranda duruyor, kaydetmede uyarıyoruz */
    }
  }, []);

  /* ---------- Koordinat çevirisi ---------- */

  function icKonum(e: React.PointerEvent): Nokta {
    const c = tuvalRef.current!;
    const r = c.getBoundingClientRect();
    const gorunenBoyut = r.width;
    const x = ((e.clientX - r.left - kaydirmaRef.current.x) / olcekRef.current) * (IC_BOYUT / gorunenBoyut);
    const y = ((e.clientY - r.top - kaydirmaRef.current.y) / olcekRef.current) * (IC_BOYUT / gorunenBoyut);
    const basinc = e.pointerType === "pen" && e.pressure > 0 ? 0.35 + e.pressure * 0.9 : 1;
    return { x, y, b: basinc };
  }

  /* ---------- Pointer olayları ---------- */

  function bas(e: React.PointerEvent<HTMLCanvasElement>) {
    parmaklarRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // İki parmak → yakınlaştır/kaydır, çizme
    if (parmaklarRef.current.size === 2) {
      aktifRef.current = null;
      const [a, b] = [...parmaklarRef.current.values()];
      jestRef.current = {
        mesafe: Math.hypot(a.x - b.x, a.y - b.y),
        olcek: olcekRef.current,
        orta: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        kaydirma: { ...kaydirmaRef.current },
      };
      return;
    }
    if (parmaklarRef.current.size > 2) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const n = icKonum(e);

    if (arac === "damlalik") {
      const r = rengiOku(n.x, n.y);
      if (r) { setRenk(r); setArac("firca"); }
      return;
    }
    if (arac === "dolgu") {
      islemlerRef.current.push({ tur: "dolgu", renk, x: n.x, y: n.y });
      geriAlinanRef.current = [];
      setIleriVar(false);
      setBosMu(false);
      yenidenCiz();
      taslakYaz();
      return;
    }

    aktifRef.current = {
      tur: "cizgi",
      renk,
      kalinlik,
      silgi: arac === "silgi",
      noktalar: [n],
    };
    islemlerRef.current.push(aktifRef.current);
    geriAlinanRef.current = [];
    setIleriVar(false);
    setBosMu(false);
    yenidenCiz();
  }

  function kaydir(e: React.PointerEvent<HTMLCanvasElement>) {
    if (parmaklarRef.current.has(e.pointerId)) {
      parmaklarRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // İki parmak jesti
    if (parmaklarRef.current.size === 2 && jestRef.current) {
      const [a, b] = [...parmaklarRef.current.values()];
      const mesafe = Math.hypot(a.x - b.x, a.y - b.y);
      const orta = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const j = jestRef.current;
      const yeniOlcek = Math.min(5, Math.max(1, (j.olcek * mesafe) / j.mesafe));
      const k = yeniOlcek / j.olcek;
      setOlcek(yeniOlcek);
      setKaydirma({
        x: orta.x - (j.orta.x - j.kaydirma.x) * k,
        y: orta.y - (j.orta.y - j.kaydirma.y) * k,
      });
      return;
    }

    const a = aktifRef.current;
    if (!a || a.tur !== "cizgi") return;
    a.noktalar.push(icKonum(e));
    const ctx = tuvalRef.current?.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const oran = tuvalRef.current!.width / IC_BOYUT;
    ctx.setTransform(oran, 0, 0, oran, 0, 0);
    islemUygula(ctx, a);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function birak(e: React.PointerEvent<HTMLCanvasElement>) {
    parmaklarRef.current.delete(e.pointerId);
    if (parmaklarRef.current.size < 2) jestRef.current = null;
    if (aktifRef.current) {
      aktifRef.current = null;
      taslakYaz();
    }
  }

  /* ---------- Araç eylemleri ---------- */

  function geriAl() {
    const son = islemlerRef.current.pop();
    if (son) geriAlinanRef.current.push(son);
    setIleriVar(geriAlinanRef.current.length > 0);
    setBosMu(islemlerRef.current.length === 0);
    yenidenCiz();
    taslakYaz();
  }

  function ileriAl() {
    const o = geriAlinanRef.current.pop();
    if (!o) return;
    islemlerRef.current.push(o);
    setIleriVar(geriAlinanRef.current.length > 0);
    setBosMu(false);
    yenidenCiz();
    taslakYaz();
  }

  function temizle() {
    geriAlinanRef.current = [...islemlerRef.current].reverse();
    islemlerRef.current = [];
    setIleriVar(geriAlinanRef.current.length > 0);
    setBosMu(true);
    setTaslakGeriYuklendi(false);
    yenidenCiz();
    taslakYaz();
  }

  function gorunumSifirla() {
    setOlcek(1);
    setKaydirma({ x: 0, y: 0 });
  }

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
    try {
      localStorage.removeItem(TASLAK_ANAHTARI);
    } catch { /* önemsiz */ }
    onKaydet(hedef.toDataURL("image/png"));
  }

  /* ---------- Arayüz parçaları ---------- */

  const araclar: { id: Arac; ad: string; ikon: Parameters<typeof Ikon>[0]["ad"] }[] = [
    { id: "firca", ad: "Fırça", ikon: "kalem" },
    { id: "silgi", ad: "Silgi", ikon: "silgi" },
    { id: "dolgu", ad: "Boya dök", ikon: "palet" },
    { id: "damlalik", ad: "Renk kap", ikon: "yildiz" },
  ];

  const tuvalAlani = (
    <div
      ref={sarmalRef}
      className={tamEkran ? "flex-1 overflow-hidden p-2" : "clay p-2.5"}
    >
      <div className="relative overflow-hidden rounded-[16px]">
        <canvas
          ref={tuvalRef}
          className="tuval w-full"
          style={{
            transform: `translate(${kaydirma.x}px, ${kaydirma.y}px) scale(${olcek})`,
            transformOrigin: "0 0",
          }}
          onPointerDown={bas}
          onPointerMove={kaydir}
          onPointerUp={birak}
          onPointerCancel={birak}
          onPointerLeave={birak}
          aria-label="Çizim alanı. Parmağınla veya kalemle çiz. İki parmakla yakınlaştır."
          role="img"
        />
      </div>
    </div>
  );

  const aracCubugu = (
    <div className="clay-soft flex flex-wrap items-center gap-2 p-3">
      <div className="flex items-center gap-1.5" role="group" aria-label="Araçlar">
        {araclar.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setArac(a.id)}
            aria-label={a.ad}
            aria-pressed={arac === a.id}
            className={[
              "flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-[14px] border-[3px] transition-all duration-200",
              arac === a.id
                ? "border-mor bg-mor text-white"
                : "border-transparent bg-white/70 text-ink hover:bg-white",
            ].join(" ")}
          >
            <Ikon ad={a.ikon} boyut={20} />
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" onClick={geriAl} disabled={bosMu} className="clay-btn kucuk beyaz">
          <Ikon ad="geriAl" boyut={19} />
          <span className="gizli-metin">Geri al</span>
        </button>
        <button
          type="button"
          onClick={ileriAl}
          disabled={!ileriVar}
          className="clay-btn kucuk beyaz"
        >
          <Ikon ad="geriAl" boyut={19} className="scale-x-[-1]" />
          <span className="gizli-metin">İleri al</span>
        </button>
        <button type="button" onClick={temizle} disabled={bosMu} className="clay-btn kucuk beyaz">
          <Ikon ad="cop" boyut={19} />
          <span className="gizli-metin">Hepsini sil</span>
        </button>
      </div>
    </div>
  );

  const renkCubugu = (
    <div className="clay-soft p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-inksoft">Renk seç</p>
        <label className="flex cursor-pointer items-center gap-2 text-[12px] font-bold text-mor">
          Kendi rengin
          <input
            type="color"
            value={renk}
            onChange={(e) => { setRenk(e.target.value); setArac("firca"); }}
            aria-label="Kendi rengini seç"
            className="h-9 w-9 cursor-pointer rounded-full border-[3px] border-white shadow-[0_3px_0_rgba(46,16,101,0.18)]"
          />
        </label>
      </div>
      <div className="grid grid-cols-8 gap-2">
        {RENKLER.map((r) => {
          const secili = renk.toLowerCase() === r.toLowerCase() && arac !== "silgi";
          return (
            <button
              key={r}
              type="button"
              onClick={() => { setRenk(r); setArac("firca"); }}
              aria-label={`Renk ${r}`}
              aria-pressed={secili}
              className={[
                "aspect-square w-full cursor-pointer rounded-full border-[3px] shadow-[0_3px_0_rgba(46,16,101,0.18)] transition-transform duration-200",
                secili ? "scale-110 border-ink" : "border-white hover:scale-105",
              ].join(" ")}
              style={{ background: r }}
            />
          );
        })}
      </div>
    </div>
  );

  const kalinlikCubugu = (
    <div className="clay-soft flex flex-col gap-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5" role="group" aria-label="Hazır kalınlıklar">
        {KALINLIKLAR.map((k) => (
          <button
            key={k.boyut}
            type="button"
            onClick={() => setKalinlik(k.boyut)}
            aria-label={k.ad}
            aria-pressed={kalinlik === k.boyut}
            className={[
              "flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-[14px] border-[3px] transition-all duration-200",
              kalinlik === k.boyut
                ? "border-mor bg-white"
                : "border-transparent bg-white/60 hover:bg-white",
            ].join(" ")}
          >
            <span
              className="rounded-full bg-ink"
              style={{ width: k.boyut / 1.6 + 6, height: k.boyut / 1.6 + 6 }}
            />
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOlcek((o) => Math.min(5, o + 0.5))}
          className="clay-btn kucuk beyaz"
          aria-label="Yakınlaştır"
        >
          <Ikon ad="arti" boyut={18} />
        </button>
        <button
          type="button"
          onClick={gorunumSifirla}
          disabled={olcek === 1 && kaydirma.x === 0 && kaydirma.y === 0}
          className="clay-btn kucuk beyaz"
          aria-label="Görünümü sıfırla"
        >
          <span className="font-display text-[13px] tabular-nums">{olcek.toFixed(1)}x</span>
        </button>
        <button
          type="button"
          onClick={() => setTamEkran((t) => !t)}
          className="clay-btn kucuk"
          aria-label={tamEkran ? "Tam ekrandan çık" : "Tam ekran çiz"}
          aria-pressed={tamEkran}
        >
          <Ikon ad={tamEkran ? "geri" : "cerceve"} boyut={18} />
        </button>
      </div>
      </div>

      {/* İnce ayar: 1'den 30'a kadar her değer + canlı önizleme */}
      <div className="flex items-center gap-3 pt-1">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center"
        >
          <span
            className="rounded-full bg-ink transition-all duration-150"
            style={{ width: Math.max(3, kalinlik), height: Math.max(3, kalinlik) }}
          />
        </span>

        <input
          type="range"
          className="kaydirici flex-1"
          min={EN_INCE}
          max={EN_KALIN}
          step={1}
          value={kalinlik}
          onChange={(e) => setKalinlik(Number(e.target.value))}
          aria-label="Çizgi kalınlığı"
          aria-valuetext={`${kalinlik} kalınlık`}
        />

        <span className="w-9 shrink-0 text-center font-display text-base font-bold tabular-nums text-mor">
          {kalinlik}
        </span>
      </div>
    </div>
  );

  /* ---------- Tam ekran ---------- */

  if (tamEkran) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-ground p-2 pb-[max(8px,env(safe-area-inset-bottom))]">
        {tuvalAlani}
        <div className="flex flex-col gap-2">
          {aracCubugu}
          {renkCubugu}
          {kalinlikCubugu}
          <button
            type="button"
            onClick={kaydet}
            disabled={bosMu || kaydediliyor}
            className="clay-btn pembe w-full"
          >
            <Ikon ad="onay" boyut={21} />
            Müzeye as!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {taslakGeriYuklendi && (
        <p className="clay-soft flex items-center gap-2 p-3 text-sm font-bold text-mor">
          <Ikon ad="onay" boyut={18} />
          Yarım kalan çizimin geri yüklendi.
        </p>
      )}

      {tuvalAlani}
      {aracCubugu}
      {renkCubugu}
      {kalinlikCubugu}

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
