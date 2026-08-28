import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito_Sans } from "next/font/google";
import "./globals.css";

/* Başlık yazısı — yuvarlak, oyuncak gibi, karakterli */
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

/* Metin yazısı — uzun okumada yormaz, Türkçe karakterleri tam */
const nunito = Nunito_Sans({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const ACIKLAMA =
  "Duru'nun çizim müzesi ve kendi kitaplarını yazdığı atölye. Her gün yeni bir çizim görevi, her çizim gökkuşağı bir çerçevede.";

export const metadata: Metadata = {
  // Vercel'e çıkınca burayı gerçek adrese çeviriyoruz.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001",
  ),
  title: "Duru'nun Atölyesi",
  description: ACIKLAMA,
  applicationName: "Duru'nun Atölyesi",
  icons: {
    icon: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
    // icon.png degrade zeminli (şeffaf değil) — iOS'ta siyah kenar çıkmaz.
    apple: [{ url: "/icon.png", sizes: "512x512", type: "image/png" }],
  },
  openGraph: {
    title: "Duru'nun Atölyesi",
    description: ACIKLAMA,
    locale: "tr_TR",
    type: "website",
    siteName: "Duru'nun Atölyesi",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Duru'nun Atölyesi — renkli çerçevelerde çocuk çizimleri, fırça ve kitap",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Duru'nun Atölyesi",
    description: ACIKLAMA,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#faf5ff",
  width: "device-width",
  initialScale: 1,
  // Yakınlaştırma açık bırakıldı — kapatmak erişilebilirlik ihlali.
  maximumScale: 5,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${baloo.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
