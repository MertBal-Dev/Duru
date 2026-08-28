"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAtolye } from "@/lib/atolye";
import Ikon from "./Ikon";

/* ============================================================
   OTURUM KAPISI
   Giriş yapılmadan hiçbir sayfa gösterilmez. Veriler zaten
   veritabanında satır düzeyi güvenlikle korunuyor; bu kapı
   sadece arayüz tarafındaki karşılığı.
   ============================================================ */

const ACIK_YOLLAR = ["/giris"];

export default function Kapi({ children }: { children: React.ReactNode }) {
  const { durum, tasiniyor } = useAtolye();
  const yol = usePathname();
  const router = useRouter();
  const acikSayfa = ACIK_YOLLAR.includes(yol);

  useEffect(() => {
    if (durum === "girissiz" && !acikSayfa) router.replace("/giris");
    if (durum === "hazir" && acikSayfa) router.replace("/");
  }, [durum, acikSayfa, router]);

  if (acikSayfa) return <>{children}</>;

  if (durum === "kurulumsuz") {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <section className="clay p-6">
          <h1 className="mb-2 text-2xl text-ink">Kurulum tamamlanmamış</h1>
          <p className="mb-4 text-sm font-semibold text-inksoft">
            Supabase anahtarları tanımlı değil, bu yüzden atölye açılamıyor.
          </p>
          <ol className="flex flex-col gap-2 text-sm font-semibold text-ink">
            <li>1. supabase.com&apos;da bir proje aç</li>
            <li>
              2. <code>supabase/schema.sql</code> dosyasını SQL Editor&apos;de çalıştır
            </li>
            <li>
              3. Proje kökünde <code>.env.local</code> oluşturup anahtarları yaz
            </li>
          </ol>
        </section>
      </main>
    );
  }

  if (tasiniyor) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 py-10 text-center">
        <div className="salin mb-5 flex h-20 w-20 items-center justify-center rounded-[22px] bg-gk3/25 text-gk3">
          <Ikon ad="cerceve" boyut={38} />
        </div>
        <h1 className="mb-2 text-2xl text-ink">Çizimlerin taşınıyor</h1>
        <p className="nabiz text-sm font-semibold text-inksoft">
          Bu cihazdaki eski çizimlerin hesabına aktarılıyor. Bir dakika sürebilir…
        </p>
      </main>
    );
  }

  if (durum !== "hazir") {
    return (
      <main
        className="flex flex-1 items-center justify-center px-5"
        aria-busy="true"
        aria-label="Yükleniyor"
      >
        <div className="salin flex h-16 w-16 items-center justify-center rounded-[20px] bg-mor/15 text-mor">
          <Ikon ad="palet" boyut={30} />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
