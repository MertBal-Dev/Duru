/* ============================================================
   GÜNLÜK ÇİZİM GÖREVLERİ
   Duru hayvanları, doğayı, renkleri ve kıyafet tasarlamayı seviyor —
   görevler ona göre yazıldı.
   Görev tarihe göre seçilir: aynı gün hep aynı görev gelir,
   ertesi gün yenisi açılır.
   ============================================================ */

export const GOREVLER: string[] = [
  "Gökkuşağı renginde bir at çiz",
  "Kendi icat ettiğin bir hayvan çiz — adını da sen koy",
  "Şemsiyesi olan bir kedi çiz",
  "Denizin dibinde bir ev çiz, içinde kim yaşıyor?",
  "Bir kelebeğin kanatlarını istediğin gibi süsle",
  "Uyuyan bir ejderha çiz",
  "Kendine bir parti elbisesi tasarla",
  "Ağaçta yaşayan küçük bir kapı çiz",
  "Bulutların üstünde yürüyen bir hayvan çiz",
  "En sevdiğin meyveyi dev gibi çiz, yanına da minik bir insan",
  "Kışın üşümeyen bir kuş çiz — atkısını da sen tasarla",
  "Sihirli bir orman çiz, içinde parlayan bir şey olsun",
  "Balıklara ev olan bir çaydanlık çiz",
  "Kanatları olan bir tilki çiz",
  "Kendi kedi/köpek kulübeni tasarla — lüks olsun!",
  "Gece açan bir çiçek çiz",
  "Bir kaplumbağanın sırtında koca bir şehir çiz",
  "Yağmur damlalarını renkli çiz",
  "Kendine sihirli bir şapka tasarla",
  "Kar taneleri toplayan bir sincap çiz",
  "İçinde yıldız olan bir kavanoz çiz",
  "Dans eden bir ahtapot çiz — sekiz kolu ne yapıyor?",
  "Sadece iki renk kullanarak bir manzara çiz",
  "Bir ejderha yavrusu ve onun oyuncağını çiz",
  "Çiçeklerden yapılmış bir taç tasarla",
  "Uzayda pikniğe giden bir aile çiz",
  "Bir baykuşun gece gördüklerini çiz",
  "Kendine kanatlı ayakkabılar tasarla",
  "Kirpi ile balonun arkadaşlığını çiz",
  "Renkleri ters bir dünya çiz — gökyüzü yeşil, çimen mavi",
  "Bir kediyi astronot kıyafetiyle çiz",
  "Şeker evinde yaşayan bir hayvan çiz",
  "Kendi bahçeni çiz — içinde olmayan bir bitki uydur",
  "Sırtında çiçek bahçesi taşıyan bir ayı çiz",
  "Bir yunusun rüyasını çiz",
  "Kendine yağmurda giyeceğin bir kombin tasarla",
  "Kuyruğu gökkuşağı olan bir tavus kuşu çiz",
  "Küçük bir fareye kocaman bir kütüphane çiz",
  "Denizanası ama ışıklı — çiz bakalım",
  "Bir zürafanın boynuna asılı şeyleri çiz",
  "Kendi çizim odanı hayal et ve çiz",
  "Yalnız bir bulut çiz, ona arkadaş da çiz",
  "Ayakkabılı bir kurbağa çiz",
  "Sonbahar yaprağının içinde uyuyan biri çiz",
  "Kendine bir müzik aleti tasarla — dünyada olmayan bir tane",
  "Bir panda ve onun gizli hobisini çiz",
  "Kelebeklerin okulunu çiz",
  "Sadece daire kullanarak bir hayvan çiz",
  "Kanatlarında harita olan bir kuş çiz",
  "Kendi doğum günü pastanı tasarla",
  "Bir lamanın yün kıyafetini çiz",
  "Deniz kabuğunun içindeki dünyayı çiz",
  "Kirpi ama dikenleri çiçek — çiz",
  "Kendi süper kahraman kostümünü tasarla",
  "Bir kediyi kitap okurken çiz",
  "Yağmur sonrası çamurda oynayan bir hayvan çiz",
  "Ay'da yaşayan bir tavşan çiz",
  "Kendine kış için sihirli bir battaniye tasarla",
  "Bir arı ve onun bal dükkânını çiz",
  "Gözleri yıldız olan bir yaratık çiz",
];

/** Günün görevi — tarihe göre sabit, gün boyu değişmez */
export function gununGorevi(tarih?: string): string {
  const d = tarih ? new Date(tarih) : new Date();
  const gun = Math.floor(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000,
  );
  return GOREVLER[((gun % GOREVLER.length) + GOREVLER.length) % GOREVLER.length];
}
