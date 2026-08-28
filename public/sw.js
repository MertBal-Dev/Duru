/* ============================================================
   SERVİS ÇALIŞANI
   Strateji: önce ağ, olmazsa önbellek.
   Böylece internet varken hep güncel içerik gelir, internet
   yokken (tablette, arabada, uçakta) site yine de açılır.

   Duru'nun çizimleri zaten cihazın kendi hafızasında durduğu için
   çevrimdışıyken de çizim yapabilir ve kaydedebilir.
   ============================================================ */

const ONBELLEK = "duru-atolye-v1";

/* Kurulumda peşinen alınacaklar — hepsi olmasa da kurulum başarısız olmasın */
const TEMEL = ["/", "/ciz", "/muze", "/kitaplik", "/icon-192.png", "/logo.png"];

self.addEventListener("install", (olay) => {
  olay.waitUntil(
    caches
      .open(ONBELLEK)
      .then((o) => Promise.allSettled(TEMEL.map((y) => o.add(y))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (olay) => {
  olay.waitUntil(
    caches
      .keys()
      .then((adlar) =>
        Promise.all(adlar.filter((a) => a !== ONBELLEK).map((a) => caches.delete(a))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (olay) => {
  const istek = olay.request;

  // Sadece kendi sitemizin GET isteklerini yönetiyoruz
  if (istek.method !== "GET") return;
  let adres;
  try {
    adres = new URL(istek.url);
  } catch {
    return;
  }
  if (adres.origin !== self.location.origin) return;

  olay.respondWith(
    fetch(istek)
      .then((yanit) => {
        // Başarılı yanıtı sessizce önbelleğe al
        if (yanit && yanit.status === 200 && yanit.type === "basic") {
          const kopya = yanit.clone();
          caches
            .open(ONBELLEK)
            .then((o) => o.put(istek, kopya))
            .catch(() => {});
        }
        return yanit;
      })
      .catch(async () => {
        const kayitli = await caches.match(istek);
        if (kayitli) return kayitli;
        // Sayfa isteğiyse ana sayfayı göster, en azından uygulama açılsın
        if (istek.mode === "navigate") {
          const ana = await caches.match("/");
          if (ana) return ana;
        }
        return new Response("Çevrimdışısın ve bu sayfa henüz kaydedilmemiş.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }),
  );
});
