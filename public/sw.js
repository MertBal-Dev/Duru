/* ============================================================
   SERVİS ÇALIŞANI

   ÖNEMLİ KURAL: HTML sayfaları ASLA önbelleğe alınmaz.
   Eski sürümde alınıyordu ve yeni yayın çıkınca tablette eski
   sayfa gösteriliyordu ("güncellemeyi göremiyorum" sorunu).

   Strateji:
   - Sayfa istekleri (navigate): her zaman ağdan. Ağ yoksa
     çevrimdışı kabuğu gösterilir.
   - /_next/static/ dosyaları: içerik damgalı (adları değişince
     içerikleri de değişir), bu yüzden sonsuza kadar saklanabilir.
   - Diğer statik dosyalar (ikon, logo): önce önbellek, arkada
     tazele.

   Böylece internet varken HER ZAMAN en güncel sürüm görünür.
   ============================================================ */

const SURUM = "v3";
const KABUK = `atolye-kabuk-${SURUM}`;
const VARLIK = `atolye-varlik-${SURUM}`;
const CEVRIMDISI = "/cevrimdisi.html";

self.addEventListener("install", (olay) => {
  olay.waitUntil(
    caches
      .open(KABUK)
      .then((o) =>
        Promise.allSettled([
          o.add(CEVRIMDISI),
          o.add("/icon-192.png"),
          o.add("/logo.png"),
        ]),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (olay) => {
  olay.waitUntil(
    (async () => {
      // Bu sürüme ait olmayan TÜM önbellekleri sil
      const adlar = await caches.keys();
      await Promise.all(
        adlar.filter((a) => a !== KABUK && a !== VARLIK).map((a) => caches.delete(a)),
      );
      // Tarayıcı desteği varsa gezinme ön yüklemesini aç
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

/* Sayfa "hemen güncelle" derse bekleyen çalışanı devreye al */
self.addEventListener("message", (olay) => {
  if (olay.data === "HEMEN_GECER") self.skipWaiting();
});

self.addEventListener("fetch", (olay) => {
  const istek = olay.request;
  if (istek.method !== "GET") return;

  let adres;
  try {
    adres = new URL(istek.url);
  } catch {
    return;
  }
  if (adres.origin !== self.location.origin) return;

  /* --- 1) Sayfa istekleri: HER ZAMAN ağdan, asla önbellekten --- */
  if (istek.mode === "navigate") {
    olay.respondWith(
      (async () => {
        try {
          const onYukleme = await olay.preloadResponse;
          if (onYukleme) return onYukleme;
          return await fetch(istek);
        } catch {
          const kabuk = await caches.open(KABUK);
          return (
            (await kabuk.match(CEVRIMDISI)) ??
            new Response("Çevrimdışısın.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })(),
    );
    return;
  }

  /* --- 2) İçerik damgalı paketler: önbellekten ver, yoksa indir --- */
  if (adres.pathname.startsWith("/_next/static/")) {
    olay.respondWith(
      (async () => {
        const o = await caches.open(VARLIK);
        const kayitli = await o.match(istek);
        if (kayitli) return kayitli;
        const yanit = await fetch(istek);
        if (yanit.ok) o.put(istek, yanit.clone());
        return yanit;
      })(),
    );
    return;
  }

  /* --- 3) Diğer statikler: önbellekten ver, arkada tazele --- */
  if (/\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(adres.pathname)) {
    olay.respondWith(
      (async () => {
        const o = await caches.open(VARLIK);
        const kayitli = await o.match(istek);
        const agdan = fetch(istek)
          .then((y) => {
            if (y.ok) o.put(istek, y.clone());
            return y;
          })
          .catch(() => null);
        return kayitli ?? (await agdan) ?? new Response("", { status: 504 });
      })(),
    );
  }

  /* Geri kalan her şey (API çağrıları dahil) doğrudan ağa gider */
});
