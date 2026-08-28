"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Ikon from "@/components/Ikon";
import AltMenu from "@/components/AltMenu";
import { cerceveNo, tarihYaz, useDepo, yeniId } from "@/lib/depo";

/* Duru'ya söz verdiğimiz başlangıç kitabı: konuşabilen bir kedi.
   İlk cümle hazır geliyor ama tamamen değiştirilebilir —
   amaç boş sayfa korkusunu kaldırmak, hikâyeyi onun yerine yazmak değil. */
const BASLANGIC_KITABI = {
  baslik: "Konuşabilen Kedim",
  ilkSayfa:
    "Kedimin konuştuğunu ilk kez bir salı sabahı duydum. Mutfakta duruyordu ve bana baktı, sonra da dedi ki: ",
};

export default function Kitaplik() {
  const { depo, hazir, kitapEkle, kitapGuncelle, kitapSil } = useDepo();
  const router = useRouter();
  const [yeniAd, setYeniAd] = useState("");
  const [silId, setSilId] = useState<string | null>(null);

  function kitapYap(baslik: string, ilkSayfa?: string) {
    const ad = baslik.trim();
    if (!ad) return;
    const id = kitapEkle(ad);
    if (ilkSayfa) {
      kitapGuncelle(id, (k) => ({
        ...k,
        sayfalar: [{ id: yeniId(), metin: ilkSayfa }],
      }));
    }
    setYeniAd("");
    router.push(`/kitap/${id}`);
  }

  function kapak(kitapId: string) {
    const k = depo.kitaplar.find((x) => x.id === kitapId);
    if (!k) return null;
    const cid = k.kapakCizimId ?? k.sayfalar.find((s) => s.cizimId)?.cizimId;
    return depo.cizimler.find((c) => c.id === cid) ?? null;
  }

  return (
    <>
      <main className="giris mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-4">
        <header className="mb-5 flex items-center gap-3">
          <Link
            href="/"
            aria-label="Atölyeye dön"
            className="clay flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center text-mor transition-transform duration-200 active:translate-y-1"
          >
            <Ikon ad="geri" boyut={22} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] text-ink">Kitaplarım</h1>
            <p className="text-sm font-semibold text-inksoft">
              {hazir ? `${depo.kitaplar.length} kitap yazdın` : "…"}
            </p>
          </div>
        </header>

        {/* ---------- Yeni kitap ---------- */}
        <section className="clay mb-5 p-4">
          <label
            htmlFor="yeni-kitap"
            className="mb-2 block text-[12px] font-bold uppercase tracking-[0.1em] text-pembe"
          >
            Yeni kitap başlat
          </label>
          <div className="flex gap-2">
            <input
              id="yeni-kitap"
              className="clay-input"
              value={yeniAd}
              onChange={(e) => setYeniAd(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && kitapYap(yeniAd)}
              placeholder="Kitabının adı…"
              maxLength={45}
            />
            <button
              type="button"
              onClick={() => kitapYap(yeniAd)}
              disabled={!yeniAd.trim()}
              className="clay-btn"
              aria-label="Kitabı oluştur"
            >
              <Ikon ad="arti" boyut={20} />
            </button>
          </div>

          {hazir && depo.kitaplar.length === 0 && (
            <button
              type="button"
              onClick={() => kitapYap(BASLANGIC_KITABI.baslik, BASLANGIC_KITABI.ilkSayfa)}
              className="clay-btn pembe mt-3 w-full"
            >
              <Ikon ad="yildiz" boyut={19} dolu />
              Konuşan kedi kitabıyla başla
            </button>
          )}
        </section>

        {/* ---------- Kitap rafı ---------- */}
        {hazir && depo.kitaplar.length === 0 && (
          <section className="clay-soft p-6 text-center">
            <div className="salin mx-auto mb-3 flex h-18 w-18 items-center justify-center rounded-[22px] bg-gk5/20 p-4 text-gk5">
              <Ikon ad="kitap" boyut={34} />
            </div>
            <h2 className="mb-1 text-xl text-ink">Rafın boş</h2>
            <p className="text-sm font-semibold text-inksoft">
              Bir kitap başlat — her gün bir sayfa yazsan bile bir ayda koca bir hikâyen olur.
            </p>
          </section>
        )}

        {hazir && depo.kitaplar.length > 0 && (
          <ul className="flex flex-col gap-3">
            {depo.kitaplar.map((k, i) => {
              const kap = kapak(k.id);
              const yazili = k.sayfalar.filter((s) => s.metin.trim()).length;
              return (
                <li
                  key={k.id}
                  className="clay belir relative flex items-center gap-3 p-3"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <Link
                    href={`/kitap/${k.id}`}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                  >
                    <span
                      className={`cerceve ${kap ? `cerceve-n${cerceveNo(kap.id)}` : "cerceve-n5"} !p-1.5 h-16 w-16 shrink-0`}
                    >
                      {kap ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={kap.veri}
                          alt=""
                          className="h-full w-full rounded-[8px] bg-white object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center rounded-[8px] bg-white text-gk5">
                          <Ikon ad="kitap" boyut={24} />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-lg font-bold text-ink">
                        {k.baslik}
                      </span>
                      <span className="block text-sm font-semibold text-inksoft">
                        {yazili} sayfa · {tarihYaz(k.tarih)}
                      </span>
                    </span>
                    <Ikon ad="sag" boyut={20} className="shrink-0 text-inksoft" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSilId(silId === k.id ? null : k.id)}
                    aria-label={`${k.baslik} kitabını sil`}
                    className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-[14px] text-inksoft transition-colors hover:bg-surface2 hover:text-uyari"
                  >
                    <Ikon ad="cop" boyut={19} />
                  </button>

                  {silId === k.id && (
                    <div className="clay-soft absolute right-4 z-10 -mt-2 translate-y-16 p-3 shadow-xl">
                      <p className="mb-2 text-sm font-bold text-ink">Kitap silinsin mi?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSilId(null)}
                          className="clay-btn kucuk beyaz"
                        >
                          Vazgeç
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            kitapSil(k.id);
                            setSilId(null);
                          }}
                          className="clay-btn kucuk pembe"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <AltMenu />
    </>
  );
}
