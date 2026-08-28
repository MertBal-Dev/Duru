"use client";

import { useEffect } from "react";

/* ============================================================
   SERVİS ÇALIŞANI KAYDI + OTOMATİK GÜNCELLEME

   Sorun: tablete kurulu uygulama açıldığında eski sürümde
   kalıyordu; Duru güncellemeleri göremiyordu.

   Çözüm üç parçalı:
   1. updateViaCache: "none" — tarayıcı sw.js'i HTTP önbelleğinden
      servis etmesin, hep sunucudan sorsun.
   2. Uygulama her açıldığında ve arka plandan öne geldiğinde
      güncelleme kontrolü yap.
   3. Yeni çalışan hazır olduğunda devreye alıp sayfayı bir kez
      yenile. Kullanıcı hiçbir şey yapmaz.
   ============================================================ */

export default function PWA() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let yenilendi = false;
    let kayit: ServiceWorkerRegistration | null = null;

    /* Yeni çalışan devreye girdiğinde sayfayı bir kez yenile */
    const kontrolDegisti = () => {
      if (yenilendi) return;
      yenilendi = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", kontrolDegisti);

    /* Beklemedeki çalışanı hemen devreye sok */
    const devreyeAl = (k: ServiceWorkerRegistration) => {
      if (k.waiting) k.waiting.postMessage("HEMEN_GECER");
    };

    const kaydet = async () => {
      try {
        kayit = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });

        // Zaten bekleyen bir sürüm varsa hemen geç
        devreyeAl(kayit);

        kayit.addEventListener("updatefound", () => {
          const yeni = kayit?.installing;
          if (!yeni) return;
          yeni.addEventListener("statechange", () => {
            // Yeni sürüm kuruldu ve halihazırda bir çalışan varsa: geçiş yap
            if (yeni.state === "installed" && navigator.serviceWorker.controller) {
              devreyeAl(kayit!);
            }
          });
        });

        await kayit.update();
      } catch {
        // Kayıt başarısızsa site normal çalışır, sadece çevrimdışı desteği olmaz
      }
    };

    /* Uygulama öne geldiğinde güncelleme var mı diye bak.
       Tablette uygulama hiç kapanmadığı için bu şart. */
    const gorunurlukDegisti = () => {
      if (document.visibilityState === "visible") kayit?.update().catch(() => {});
    };
    document.addEventListener("visibilitychange", gorunurlukDegisti);

    if (document.readyState === "complete") kaydet();
    else window.addEventListener("load", kaydet, { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", kontrolDegisti);
      document.removeEventListener("visibilitychange", gorunurlukDegisti);
    };
  }, []);

  return null;
}
