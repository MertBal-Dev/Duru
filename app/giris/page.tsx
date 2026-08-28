"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Ikon from "@/components/Ikon";
import { supabase, bulutVar, hataCevir } from "@/lib/supabase";

type Kip = "giris" | "kayit";

export default function GirisSayfasi() {
  const sb = supabase();
  const router = useRouter();

  const [kip, setKip] = useState<Kip>("giris");
  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [adSoyad, setAdSoyad] = useState("");
  const [sifreGoster, setSifreGoster] = useState(false);
  const [calisiyor, setCalisiyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (!sb || calisiyor) return;

    setHata(null);
    setBilgi(null);

    if (!eposta.trim()) return setHata("E‑posta adresini yazar mısın?");
    if (sifre.length < 6) return setHata("Şifre en az 6 karakter olmalı.");

    setCalisiyor(true);
    try {
      if (kip === "kayit") {
        const { data, error } = await sb.auth.signUp({
          email: eposta.trim(),
          password: sifre,
          options: { data: { isim: adSoyad.trim() || "Sanatçı" } },
        });
        if (error) {
          setHata(hataCevir(error.message));
        } else if (data.session) {
          router.replace("/");
        } else {
          setBilgi(
            "Hesabın açıldı! E‑postana bir onay bağlantısı gönderildi, ona tıkladıktan sonra giriş yapabilirsin.",
          );
          setKip("giris");
        }
      } else {
        const { error } = await sb.auth.signInWithPassword({
          email: eposta.trim(),
          password: sifre,
        });
        if (error) setHata(hataCevir(error.message));
        else router.replace("/");
      }
    } catch {
      setHata("Bağlanamadım. İnternetini kontrol eder misin?");
    } finally {
      setCalisiyor(false);
    }
  }

  /* Anahtarlar yoksa kurulum uyarısı göster — sessizce bozulma */
  if (!bulutVar) {
    return (
      <main className="giris mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <section className="clay p-6 text-center">
          <h1 className="mb-2 text-2xl text-ink">Kurulum tamamlanmamış</h1>
          <p className="text-sm font-semibold text-inksoft">
            Supabase anahtarları tanımlı değil. <code>.env.local</code> dosyasına{" "}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> ve{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> eklenmeli.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="giris mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
      {/* ---------- Logo ---------- */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="clay salin mb-4 flex h-24 w-24 items-center justify-center overflow-hidden !p-0">
          <Image
            src="/logo.png"
            alt=""
            width={192}
            height={192}
            priority
            className="h-full w-full scale-[1.12] object-cover"
          />
        </div>
        <h1 className="text-[30px] text-ink">Atölye</h1>
        <p className="mt-1 text-sm font-semibold text-inksoft">
          Çizimlerin ve kitapların seni bekliyor
        </p>
      </div>

      {/* ---------- Giriş / Kayıt seçici ---------- */}
      <div className="clay-soft mb-4 grid grid-cols-2 gap-1.5 p-1.5" role="tablist">
        {(
          [
            ["giris", "Giriş yap"],
            ["kayit", "Hesap aç"],
          ] as [Kip, string][]
        ).map(([k, ad]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kip === k}
            onClick={() => {
              setKip(k);
              setHata(null);
              setBilgi(null);
            }}
            className={[
              "min-h-[46px] cursor-pointer rounded-[14px] font-display text-base font-bold transition-all duration-200",
              kip === k
                ? "bg-mor text-white shadow-[0_4px_0_rgba(46,16,101,0.25)]"
                : "text-inksoft hover:bg-white/70",
            ].join(" ")}
          >
            {ad}
          </button>
        ))}
      </div>

      {/* ---------- Form ---------- */}
      <form onSubmit={gonder} className="clay flex flex-col gap-3 p-5">
        {kip === "kayit" && (
          <div>
            <label
              htmlFor="ad"
              className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.1em] text-inksoft"
            >
              Adın
            </label>
            <input
              id="ad"
              className="clay-input"
              value={adSoyad}
              onChange={(e) => setAdSoyad(e.target.value)}
              placeholder="Duru"
              maxLength={24}
              autoComplete="given-name"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="eposta"
            className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.1em] text-inksoft"
          >
            E‑posta
          </label>
          <input
            id="eposta"
            type="email"
            inputMode="email"
            className="clay-input"
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            placeholder="ornek@eposta.com"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label
            htmlFor="sifre"
            className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.1em] text-inksoft"
          >
            Şifre
          </label>
          <div className="relative">
            <input
              id="sifre"
              type={sifreGoster ? "text" : "password"}
              className="clay-input pr-14"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              placeholder="En az 6 karakter"
              autoComplete={kip === "kayit" ? "new-password" : "current-password"}
              required
            />
            <button
              type="button"
              onClick={() => setSifreGoster((g) => !g)}
              aria-label={sifreGoster ? "Şifreyi gizle" : "Şifreyi göster"}
              aria-pressed={sifreGoster}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[12px] text-inksoft transition-colors hover:text-mor"
            >
              <Ikon ad={sifreGoster ? "silgi" : "yildiz"} boyut={19} />
            </button>
          </div>
        </div>

        {hata && (
          <p
            role="alert"
            className="rounded-[14px] border-[3px] border-uyari/30 bg-uyari/10 p-3 text-sm font-bold text-uyari"
          >
            {hata}
          </p>
        )}

        {bilgi && (
          <p
            role="status"
            className="rounded-[14px] border-[3px] border-basari/30 bg-basari/10 p-3 text-sm font-bold text-basari"
          >
            {bilgi}
          </p>
        )}

        <button type="submit" disabled={calisiyor} className="clay-btn mt-1 w-full">
          {calisiyor ? (
            <span className="nabiz">Bir saniye…</span>
          ) : (
            <>
              <Ikon ad="onay" boyut={20} />
              {kip === "giris" ? "Giriş yap" : "Hesabımı aç"}
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-[13px] font-semibold text-inksoft">
        Çizimlerin sadece sana ait. Şifreni kimseyle paylaşma.
      </p>
    </main>
  );
}
