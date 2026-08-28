"use client";

import { useEffect, useState } from "react";
import Ikon from "./Ikon";

/* ============================================================
   TABLETE İNDİR
   Android ve masaüstü Chrome: tarayıcı "beforeinstallprompt"
   olayını gönderiyor, biz yakalayıp kendi düğmemize bağlıyoruz.
   iPhone/iPad Safari: bu olayı hiç göndermiyor, orada elle
   "Paylaş → Ana Ekrana Ekle" adımlarını gösteriyoruz.
   Zaten kuruluysa düğme hiç görünmüyor.
   ============================================================ */

type KurulumOlayi = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function IndirButonu() {
  const [olay, setOlay] = useState<KurulumOlayi | null>(null);
  const [kurulu, setKurulu] = useState(false);
  const [iosMu, setIosMu] = useState(false);
  const [yardim, setYardim] = useState(false);

  useEffect(() => {
    const bagimsiz =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setKurulu(bagimsiz);

    const ua = navigator.userAgent;
    setIosMu(
      /iPhone|iPad|iPod/i.test(ua) ||
        // iPadOS 13+ kendini Mac gibi tanıtıyor, dokunma sayısından anlıyoruz
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );

    const yakala = (e: Event) => {
      e.preventDefault();
      setOlay(e as KurulumOlayi);
    };
    const kuruldu = () => {
      setKurulu(true);
      setOlay(null);
    };

    window.addEventListener("beforeinstallprompt", yakala);
    window.addEventListener("appinstalled", kuruldu);
    return () => {
      window.removeEventListener("beforeinstallprompt", yakala);
      window.removeEventListener("appinstalled", kuruldu);
    };
  }, []);

  async function kur() {
    if (!olay) return;
    await olay.prompt();
    const sonuc = await olay.userChoice;
    if (sonuc.outcome === "accepted") setKurulu(true);
    setOlay(null);
  }

  // Zaten kuruluysa, ya da tarayıcı kurmayı desteklemiyorsa gösterme
  if (kurulu) return null;
  if (!olay && !iosMu) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (iosMu ? setYardim(true) : kur())}
        className="clay-btn beyaz mb-4 w-full"
      >
        <Ikon ad="indir" boyut={20} />
        Atölyeyi tablete indir
      </button>

      {yardim && (
        <div
          className="fon-ac fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-3 backdrop-blur-sm sm:items-center"
          onClick={() => setYardim(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Ana ekrana ekleme adımları"
        >
          <div
            className="clay pencere-ac w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-xl text-ink">Atölyeyi ana ekrana ekle</h2>
            <p className="mb-4 text-sm font-semibold text-inksoft">
              Üç adımda uygulama gibi açılır:
            </p>

            <ol className="mb-5 flex flex-col gap-3">
              {[
                "Aşağıdaki (ya da üstteki) Paylaş düğmesine bas — içinden ok çıkan kare.",
                "Açılan listeyi kaydır, “Ana Ekrana Ekle”yi bul.",
                "“Ekle”ye bas. Atölye artık ana ekranında!",
              ].map((adim, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mor font-display text-base font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-[15px] font-semibold text-ink">{adim}</span>
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => setYardim(false)}
              className="clay-btn w-full"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  );
}
