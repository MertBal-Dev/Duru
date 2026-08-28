import type { MetadataRoute } from "next";

/* Uygulama tanımı — tarayıcı bunu okuyup "ana ekrana ekle" teklif ediyor.
   Next.js bunu /manifest.webmanifest olarak yayınlar ve <link> etiketini
   kendisi ekler. */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Duru'nun Atölyesi",
    short_name: "Atölye",
    description:
      "Duru'nun çizim müzesi ve kendi kitaplarını yazdığı atölye. Her gün yeni bir çizim görevi.",
    lang: "tr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf5ff",
    theme_color: "#faf5ff",
    categories: ["education", "entertainment", "kids"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // maskable: Android ikonu daire/kare maskeye kırparken kenar boşluğu bırakır
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Çizmeye başla", url: "/ciz" },
      { name: "Müzem", url: "/muze" },
      { name: "Kitaplarım", url: "/kitaplik" },
    ],
  };
}
