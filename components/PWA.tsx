"use client";

import { useEffect } from "react";

/* Servis çalışanını kaydeder. Görsel bir şey çizmez.
   Sadece güvenli bağlantıda (https ya da localhost) çalışır —
   tarayıcı zaten başka türlüsüne izin vermiyor. */

export default function PWA() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const kaydet = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Kayıt başarısızsa site normal çalışmaya devam eder,
        // sadece çevrimdışı desteği olmaz.
      });
    };

    // Sayfa yüklenmesini yavaşlatmasın diye yükleme bitince kaydediyoruz
    if (document.readyState === "complete") kaydet();
    else {
      window.addEventListener("load", kaydet, { once: true });
      return () => window.removeEventListener("load", kaydet);
    }
  }, []);

  return null;
}
