"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Ikon from "@/components/Ikon";
import AltMenu from "@/components/AltMenu";
import { cerceveNo, useDepo, yeniId } from "@/lib/depo";

export default function KitapSayfasi() {
  const { id } = useParams<{ id: string }>();
  const { depo, hazir, kitapGuncelle } = useDepo();
  const kitap = depo.kitaplar.find((k) => k.id === id);

  const [no, setNo] = useState(0);
  const [metin, setMetin] = useState("");
  const [secici, setSecici] = useState(false);
  const yuklendi = useRef(false);

  const sayfa = kitap?.sayfalar[no];

  /* Sayfa değişince metni tazele */
  useEffect(() => {
    if (sayfa) setMetin(sayfa.metin);
  }, [sayfa?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Yazarken kaydet — her tuşta değil, yazmayı bıraktıktan 600ms sonra.
     Depoda resimler de olduğu için her tuşta kaydetmek yavaşlatırdı. */
  useEffect(() => {
    if (!kitap || !sayfa) return;
    if (!yuklendi.current) {
      yuklendi.current = true;
      return;
    }
    if (metin === sayfa.metin) return;
    const z = setTimeout(() => {
      kitapGuncelle(kitap.id, (k) => ({
        ...k,
        sayfalar: k.sayfalar.map((s) => (s.id === sayfa.id ? { ...s, metin } : s)),
      }));
    }, 600);
    return () => clearTimeout(z);
  }, [metin]); // eslint-disable-line react-hooks/exhaustive-deps

  if (hazir && !kitap) {
    return (
      <>
        <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-8">
          <div className="clay p-6 text-center">
            <h1 className="mb-2 text-xl text-ink">Bu kitap bulunamadı</h1>
            <Link href="/kitaplik" className="clay-btn mt-3">
              Kitaplığa dön
            </Link>
          </div>
        </main>
        <AltMenu />
      </>
    );
  }

  if (!kitap || !sayfa) {
    return (
      <>
        <main className="flex-1" />
        <AltMenu />
      </>
    );
  }

  const resim = depo.cizimler.find((c) => c.id === sayfa.cizimId);
  const sonSayfa = kitap.sayfalar.length - 1;

  function sayfaEkle() {
    kitapGuncelle(kitap!.id, (k) => ({
      ...k,
      sayfalar: [...k.sayfalar, { id: yeniId(), metin: "" }],
    }));
    setNo(kitap!.sayfalar.length);
  }

  function sayfaSil() {
    if (kitap!.sayfalar.length <= 1) return;
    const silinen = sayfa!.id;
    kitapGuncelle(kitap!.id, (k) => ({
      ...k,
      sayfalar: k.sayfalar.filter((s) => s.id !== silinen),
    }));
    setNo((n) => Math.max(0, n - 1));
  }

  function resimSec(cizimId?: string) {
    kitapGuncelle(kitap!.id, (k) => ({
      ...k,
      sayfalar: k.sayfalar.map((s) => (s.id === sayfa!.id ? { ...s, cizimId } : s)),
      kapakCizimId: k.kapakCizimId ?? cizimId,
    }));
    setSecici(false);
  }

  return (
    <>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-4">
        {/* ---------- Başlık ---------- */}
        <header className="mb-4 flex items-center gap-3">
          <Link
            href="/kitaplik"
            aria-label="Kitaplığa dön"
            className="clay flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center text-mor transition-transform duration-200 active:translate-y-1"
          >
            <Ikon ad="geri" boyut={22} />
          </Link>
          <input
            className="clay-input font-display !text-[20px] font-bold"
            value={kitap.baslik}
            onChange={(e) =>
              kitapGuncelle(kitap.id, (k) => ({ ...k, baslik: e.target.value }))
            }
            aria-label="Kitabın adı"
            maxLength={45}
          />
        </header>

        {/* ---------- Sayfa ---------- */}
        <section className="clay mb-3 p-4">
          {/* Resim alanı */}
          {resim ? (
            <div className={`cerceve cerceve-n${cerceveNo(resim.id)} mb-4`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resim.veri}
                alt={resim.baslik}
                className="aspect-square w-full rounded-[12px] bg-white object-cover"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSecici(true)}
                  className="clay-btn kucuk beyaz flex-1"
                >
                  Resmi değiştir
                </button>
                <button
                  type="button"
                  onClick={() => resimSec(undefined)}
                  className="clay-btn kucuk beyaz"
                  aria-label="Resmi kaldır"
                >
                  <Ikon ad="cop" boyut={17} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSecici(true)}
              className="clay-soft mb-4 flex w-full cursor-pointer flex-col items-center gap-2 p-6 text-inksoft transition-colors hover:text-mor"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gk6/15 text-gk6">
                <Ikon ad="cerceve" boyut={26} />
              </span>
              <span className="font-display text-base font-bold">
                Bu sayfaya müzenden bir resim koy
              </span>
            </button>
          )}

          {/* Metin alanı */}
          <label htmlFor="sayfa-metni" className="gizli-metin">
            Sayfa {no + 1} metni
          </label>
          <textarea
            id="sayfa-metni"
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            placeholder="Hikâyeni buraya yaz…"
            rows={7}
            className="clay-input resize-y leading-[1.7]"
          />
        </section>

        {/* ---------- Sayfa gezinme ---------- */}
        <div className="clay-soft flex items-center gap-2 p-2.5">
          <button
            type="button"
            onClick={() => setNo((n) => Math.max(0, n - 1))}
            disabled={no === 0}
            className="clay-btn kucuk beyaz"
            aria-label="Önceki sayfa"
          >
            <Ikon ad="sol" boyut={19} />
          </button>

          <span className="flex-1 text-center font-display text-base font-bold tabular-nums text-ink">
            Sayfa {no + 1} / {kitap.sayfalar.length}
          </span>

          {no < sonSayfa ? (
            <button
              type="button"
              onClick={() => setNo((n) => n + 1)}
              className="clay-btn kucuk beyaz"
              aria-label="Sonraki sayfa"
            >
              <Ikon ad="sag" boyut={19} />
            </button>
          ) : (
            <button
              type="button"
              onClick={sayfaEkle}
              className="clay-btn kucuk"
              aria-label="Yeni sayfa ekle"
            >
              <Ikon ad="arti" boyut={19} />
            </button>
          )}
        </div>

        {kitap.sayfalar.length > 1 && (
          <button
            type="button"
            onClick={sayfaSil}
            className="mx-auto mt-3 flex cursor-pointer items-center gap-1.5 rounded-[12px] px-3 py-2 text-sm font-bold text-inksoft transition-colors hover:text-uyari"
          >
            <Ikon ad="cop" boyut={16} />
            Bu sayfayı sil
          </button>
        )}
      </main>

      {/* ---------- Müzeden resim seçici ---------- */}
      {secici && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-3 backdrop-blur-sm sm:items-center"
          onClick={() => setSecici(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Müzenden resim seç"
        >
          <div
            className="clay max-h-[85dvh] w-full max-w-md overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-3 text-xl text-ink">Müzenden bir resim seç</h2>

            {depo.cizimler.length === 0 ? (
              <div className="clay-soft p-5 text-center">
                <p className="mb-4 text-sm font-semibold text-inksoft">
                  Müzende henüz resim yok. Önce bir çizim yap, sonra kitabına koyabilirsin.
                </p>
                <Link href="/ciz" className="clay-btn w-full">
                  <Ikon ad="kalem" boyut={19} />
                  Çizmeye git
                </Link>
              </div>
            ) : (
              <ul className="grid grid-cols-3 gap-2.5">
                {depo.cizimler.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => resimSec(c.id)}
                      className={`cerceve cerceve-n${cerceveNo(c.id)} !p-1.5 block w-full cursor-pointer`}
                      aria-label={`${c.baslik} resmini bu sayfaya koy`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.veri}
                        alt=""
                        className="aspect-square w-full rounded-[9px] bg-white object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => setSecici(false)}
              className="clay-btn beyaz mt-4 w-full"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      <AltMenu />
    </>
  );
}
