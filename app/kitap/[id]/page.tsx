"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Ikon from "@/components/Ikon";
import AltMenu from "@/components/AltMenu";
import { cerceveNo, useAtolye } from "@/lib/atolye";

export default function KitapSayfasi() {
  const { id } = useParams<{ id: string }>();
  const { cizimler, kitaplar, kitapAdiDegistir, sayfaEkle, sayfaSil, sayfaYaz, sayfaResmi } =
    useAtolye();
  const kitap = kitaplar.find((k) => k.id === id);

  const [no, setNo] = useState(0);
  const [metin, setMetin] = useState("");
  const [secici, setSecici] = useState(false);
  const [yon, setYon] = useState<"ileri" | "geri">("ileri");
  const [okuma, setOkuma] = useState(false);
  const [durum, setDurum] = useState<"bos" | "yaziliyor" | "kaydedildi">("bos");
  /* Otomatik okuma: sayfayı sesli okur, bitince kendi kendine çevirir */
  const [otomatik, setOtomatik] = useState(false);

  /* Henüz veritabanına yazılmamış metin. Sayfa değişmeden önce
     mutlaka boşaltılır, yoksa hızlı yazıp sayfa çeviren yazdığını kaybeder. */
  const bekleyenRef = useRef<{ sayfaId: string; metin: string } | null>(null);

  const sayfa = kitap?.sayfalar[no];

  useEffect(() => {
    if (sayfa) setMetin(sayfa.metin);
  }, [sayfa?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function hemenKaydet() {
    const b = bekleyenRef.current;
    if (!b || !kitap) return;
    bekleyenRef.current = null;
    sayfaYaz(kitap.id, b.sayfaId, b.metin);
    setDurum("kaydedildi");
  }

  /* Yazmayı bıraktıktan 600ms sonra kaydet — her tuşta değil */
  useEffect(() => {
    if (!bekleyenRef.current) return;
    setDurum("yaziliyor");
    const z = setTimeout(hemenKaydet, 600);
    return () => clearTimeout(z);
  }, [metin]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Sesli okuma ---------- */

  function sesiDurdur() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  }

  useEffect(() => () => sesiDurdur(), []);

  /* ---------- Otomatik okuma: sayfayı oku, bitince kendi çevir ---------- */

  useEffect(() => {
    if (!otomatik || !okuma || !sayfa) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const sonu = (kitap?.sayfalar.length ?? 1) - 1;
    const yazi = sayfa.metin.trim() || "Bu sayfa henüz boş.";
    const s = new SpeechSynthesisUtterance(yazi);
    s.lang = "tr-TR";
    s.rate = 0.92;

    s.onend = () => {
      if (no < sonu) {
        setYon("ileri");
        setNo((n) => n + 1);
      } else {
        setOtomatik(false); // kitap bitti
      }
    };
    s.onerror = () => setOtomatik(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(s);

    return () => window.speechSynthesis.cancel();
    // sayfa.id değişince yeni sayfa okunur
  }, [otomatik, okuma, sayfa?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Kaydırarak sayfa çevirme ----------
     Kılavuz uyarısı: yatay kaydırma sistem hareketleriyle çakışabilir.
     Bu yüzden ekran kenarlarından (iOS'ta "geri" bölgesi) başlayan
     hareketleri yok sayıyoruz ve dikey kaydırmayı öncelikli tutuyoruz. */

  const dokunRef = useRef<{ x: number; y: number } | null>(null);
  const KENAR = 30;
  const ESIK = 60;

  function dokunBasla(e: React.PointerEvent) {
    const en = window.innerWidth;
    if (e.clientX < KENAR || e.clientX > en - KENAR) {
      dokunRef.current = null;
      return;
    }
    dokunRef.current = { x: e.clientX, y: e.clientY };
  }

  function dokunBitir(e: React.PointerEvent) {
    const b = dokunRef.current;
    dokunRef.current = null;
    if (!b || !kitap) return;

    const dx = e.clientX - b.x;
    const dy = e.clientY - b.y;
    // Belirgin ve baskın şekilde yatay olmalı — yoksa dikey kaydırmadır
    if (Math.abs(dx) < ESIK || Math.abs(dx) < Math.abs(dy) * 1.6) return;

    const sonu = kitap.sayfalar.length - 1;
    if (dx < 0 && no < sonu) elleGit(no + 1);
    else if (dx > 0 && no > 0) elleGit(no - 1);
  }

  /* Elle sayfa çevirince otomatik okuma durur — kullanıcı kontrolü önce gelir */
  function elleGit(hedef: number) {
    setOtomatik(false);
    sayfayaGit(hedef);
  }

  /* ---------- Gezinme ---------- */

  function sayfayaGit(hedef: number) {
    hemenKaydet();
    setYon(hedef > no ? "ileri" : "geri");
    setNo(hedef);
    sesiDurdur();
  }

  async function yeniSayfa() {
    hemenKaydet();
    const oncekiSayi = kitap?.sayfalar.length ?? 0;
    await sayfaEkle(kitap!.id);
    setYon("ileri");
    setNo(oncekiSayi);
  }

  function buSayfayiSil() {
    if (!kitap || !sayfa || kitap.sayfalar.length <= 1) return;
    bekleyenRef.current = null;
    sayfaSil(kitap.id, sayfa.id);
    setYon("geri");
    setNo((n) => Math.max(0, n - 1));
  }

  function okumayaGec() {
    hemenKaydet();
    setOkuma(true);
  }

  /* ---------- Bulunamadı / yükleniyor ---------- */

  if (!kitap) {
    return (
      <>
        <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-8">
          <div className="clay p-6 text-center">
            <h1 className="mb-2 text-xl text-ink">Bu kitap bulunamadı</h1>
            <Link href="/kitaplik" className="clay-btn mt-3">
              Kitaplığa dön
            </Link>
          </div>
        </main>
        <AltMenu />
      </>
    );
  }

  if (!sayfa) {
    return (
      <>
        <main className="flex-1" />
        <AltMenu />
      </>
    );
  }

  const resim = cizimler.find((c) => c.id === sayfa.cizimId);
  const sonSayfa = kitap.sayfalar.length - 1;

  return (
    <>
      <main className="giris mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-4">
        <header className="mb-4 flex items-center gap-3">
          <Link
            href="/kitaplik"
            onClick={hemenKaydet}
            aria-label="Kitaplığa dön"
            className="clay flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center text-mor transition-transform duration-200 active:translate-y-1"
          >
            <Ikon ad="geri" boyut={22} />
          </Link>
          <input
            className="clay-input font-display !text-[20px] font-bold"
            value={kitap.baslik}
            onChange={(e) => kitapAdiDegistir(kitap.id, e.target.value)}
            aria-label="Kitabın adı"
            maxLength={45}
          />
        </header>

        {/* ---------- Sayfa ---------- */}
        <div className="perspektif mb-3">
          <section key={sayfa.id} className={`clay p-4 sayfa-${yon}`}>
            {resim ? (
              <div className={`cerceve cerceve-n${cerceveNo(resim.id)} mb-4`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resim.url}
                  alt={resim.baslik}
                  className="aspect-square w-full rounded-[12px] bg-white object-cover"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSecici(true)}
                    className="clay-btn kucuk beyaz flex-1"
                  >
                    Resmi değiştir
                  </button>
                  <button
                    type="button"
                    onClick={() => sayfaResmi(kitap.id, sayfa.id, undefined)}
                    className="clay-btn kucuk beyaz"
                    aria-label="Resmi kaldır"
                  >
                    <Ikon ad="cop" boyut={17} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSecici(true)}
                className="clay-soft mb-4 flex w-full cursor-pointer flex-col items-center gap-2 p-6 text-inksoft transition-colors hover:text-mor"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gk6/15 text-gk6">
                  <Ikon ad="cerceve" boyut={26} />
                </span>
                <span className="font-display text-base font-bold">
                  Bu sayfaya müzenden bir resim koy
                </span>
              </button>
            )}

            <label htmlFor="sayfa-metni" className="gizli-metin">
              Sayfa {no + 1} metni
            </label>
            <textarea
              id="sayfa-metni"
              value={metin}
              onChange={(e) => {
                setMetin(e.target.value);
                /* Bekleyeni efekte bırakmıyoruz: efekt bir sonraki render'da
                   çalışıyor ve arada sayfa değiştirilirse yazı kayboluyordu. */
                bekleyenRef.current = { sayfaId: sayfa.id, metin: e.target.value };
              }}
              placeholder="Hikâyeni buraya yaz…"
              rows={7}
              className="clay-input resize-y leading-[1.7]"
            />
          </section>
        </div>

        {/* ---------- Durum ---------- */}
        <div className="mb-3 flex items-center gap-3 px-1 text-[13px] font-bold">
          <span
            aria-live="polite"
            className={
              durum === "kaydedildi"
                ? "flex items-center gap-1.5 text-basari"
                : durum === "yaziliyor"
                  ? "nabiz flex items-center gap-1.5 text-inksoft"
                  : "text-transparent"
            }
          >
            {durum === "kaydedildi" && <Ikon ad="onay" boyut={15} />}
            {durum === "kaydedildi"
              ? "Kaydedildi"
              : durum === "yaziliyor"
                ? "Kaydediliyor…"
                : "."}
          </span>

          <span className="ml-auto tabular-nums text-inksoft">
            {metin.trim() ? metin.trim().split(/\s+/).length : 0} kelime
          </span>

          <button
            type="button"
            onClick={okumayaGec}
            className="flex cursor-pointer items-center gap-1.5 rounded-[10px] px-2 py-1 text-mor underline underline-offset-4"
          >
            <Ikon ad="kitap" boyut={15} />
            Oku
          </button>
        </div>

        {/* ---------- Gezinme ---------- */}
        <div className="clay-soft flex items-center gap-2 p-2.5">
          <button
            type="button"
            onClick={() => sayfayaGit(Math.max(0, no - 1))}
            disabled={no === 0}
            className="clay-btn kucuk beyaz"
            aria-label="Önceki sayfa"
          >
            <Ikon ad="sol" boyut={19} />
          </button>

          <span className="flex-1 text-center font-display text-base font-bold tabular-nums text-ink">
            Sayfa {no + 1} / {kitap.sayfalar.length}
          </span>

          {no < sonSayfa ? (
            <button
              type="button"
              onClick={() => sayfayaGit(no + 1)}
              className="clay-btn kucuk beyaz"
              aria-label="Sonraki sayfa"
            >
              <Ikon ad="sag" boyut={19} />
            </button>
          ) : (
            <button
              type="button"
              onClick={yeniSayfa}
              className="clay-btn kucuk"
              aria-label="Yeni sayfa ekle"
            >
              <Ikon ad="arti" boyut={19} />
            </button>
          )}
        </div>

        {kitap.sayfalar.length > 1 && (
          <button
            type="button"
            onClick={buSayfayiSil}
            className="mx-auto mt-3 flex cursor-pointer items-center gap-1.5 rounded-[12px] px-3 py-2 text-sm font-bold text-inksoft transition-colors hover:text-uyari"
          >
            <Ikon ad="cop" boyut={16} />
            Bu sayfayı sil
          </button>
        )}
      </main>

      {/* ---------- Okuma modu ---------- */}
      {okuma && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${kitap.baslik} — okuma modu`}
          className="fon-ac fixed inset-0 z-50 flex flex-col bg-ground p-4 pb-[max(16px,env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto flex w-full max-w-lg items-center gap-3 pb-3">
            <button
              type="button"
              onClick={() => {
                setOkuma(false);
                sesiDurdur();
              }}
              aria-label="Okumayı bitir"
              className="clay flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center text-mor"
            >
              <Ikon ad="geri" boyut={22} />
            </button>
            <h2 className="min-w-0 flex-1 truncate text-xl text-ink">{kitap.baslik}</h2>
            <span className="clay-soft shrink-0 rounded-[14px] px-3 py-2 font-display text-sm font-bold tabular-nums text-inksoft">
              {no + 1}/{kitap.sayfalar.length}
            </span>
          </div>

          {/* SAHNE: perspektif burada, kaydırma sayfanın kendisinde.
              İkisi aynı öğede olursa tarayıcı 3B'yi düzleştiriyor. */}
          <div className="kitap-sahne mx-auto flex min-h-0 w-full max-w-lg flex-1">
            <section
              key={sayfa.id}
              onPointerDown={dokunBasla}
              onPointerUp={dokunBitir}
              onPointerCancel={() => (dokunRef.current = null)}
              className={`kitap-sayfa sayfa-${yon} ${
                yon === "ileri" ? "cilt-sol" : "cilt-sag"
              } w-full p-6`}
            >
              {resim && (
                <div className={`cerceve cerceve-n${cerceveNo(resim.id)} mb-6`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resim.url}
                    alt={resim.baslik}
                    className="aspect-square w-full rounded-[12px] bg-white object-cover"
                  />
                </div>
              )}

              {/* Satır uzunluğu 65-75 karakterle sınırlı (max-w-prose):
                  uzun satırlar okumayı zorlaştırıyor. */}
              <p
                className={`kitap-metin mx-auto max-w-prose text-ink ${
                  !resim && sayfa.metin.trim() ? "suslu" : ""
                }`}
              >
                {sayfa.metin || (
                  <span className="italic text-inksoft">Bu sayfa henüz boş.</span>
                )}
              </p>

              <span className="sayfa-no">— {no + 1} —</span>
            </section>
          </div>

          <div className="mx-auto w-full max-w-lg pt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => elleGit(Math.max(0, no - 1))}
                disabled={no === 0}
                className="clay-btn beyaz"
                aria-label="Önceki sayfa"
              >
                <Ikon ad="sol" boyut={20} />
              </button>

              <button
                type="button"
                onClick={() => setOtomatik((o) => !o)}
                aria-pressed={otomatik}
                className={`clay-btn flex-1 ${otomatik ? "pembe" : ""}`}
              >
                <Ikon ad={otomatik ? "cop" : "yildiz"} boyut={19} dolu={!otomatik} />
                {otomatik ? "Durdur" : "Bana oku"}
              </button>

              <button
                type="button"
                onClick={() => elleGit(no + 1)}
                disabled={no >= sonSayfa}
                className="clay-btn beyaz"
                aria-label="Sonraki sayfa"
              >
                <Ikon ad="sag" boyut={20} />
              </button>
            </div>

            <p className="kaydir-ipucu mt-2.5" aria-live="polite">
              {otomatik
                ? `Sana okuyorum · sayfa ${no + 1} / ${kitap.sayfalar.length}`
                : `Sayfa ${no + 1} / ${kitap.sayfalar.length} · parmağınla kaydırarak çevir`}
            </p>
          </div>
        </div>
      )}

      {/* ---------- Resim seçici ---------- */}
      {secici && (
        <div
          className="fon-ac fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-3 backdrop-blur-sm sm:items-center"
          onClick={() => setSecici(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Müzenden resim seç"
        >
          <div
            className="clay pencere-ac max-h-[85dvh] w-full max-w-md overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 text-xl text-ink">Müzenden bir resim seç</h2>

            {cizimler.length === 0 ? (
              <div className="clay-soft p-5 text-center">
                <p className="mb-4 text-sm font-semibold text-inksoft">
                  Müzende henüz resim yok. Önce bir çizim yap, sonra kitabına
                  koyabilirsin.
                </p>
                <Link href="/ciz" className="clay-btn w-full">
                  <Ikon ad="kalem" boyut={19} />
                  Çizmeye git
                </Link>
              </div>
            ) : (
              <ul className="grid grid-cols-3 gap-2.5">
                {cizimler.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        sayfaResmi(kitap.id, sayfa.id, c.id);
                        setSecici(false);
                      }}
                      className={`cerceve cerceve-n${cerceveNo(c.id)} !p-1.5 block w-full cursor-pointer`}
                      aria-label={`${c.baslik} resmini bu sayfaya koy`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.url}
                        alt=""
                        className="aspect-square w-full rounded-[9px] bg-white object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => setSecici(false)}
              className="clay-btn beyaz mt-4 w-full"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      <AltMenu />
    </>
  );
}
