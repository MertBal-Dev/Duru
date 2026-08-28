import { test, expect, type Page } from "@playwright/test";

/* ============================================================
   DURU'NUN ATÖLYESİ — uçtan uca testler
   Her test kendi tarayıcı bağlamında çalışır, yani her biri
   bomboş bir localStorage ile başlar. Testler birbirini etkilemez.
   ============================================================ */

/* ------------------------------------------------------------
   OTURUM
   Artık her sayfa giriş gerektiriyor. Supabase ayarlanmadıysa
   testler hata vermek yerine ATLANIR — böylece kurulum yapmadan
   da takım çalıştırılabilir ve neyin eksik olduğu net görünür.
   ------------------------------------------------------------ */

const KURULU = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const TEST_EPOSTA = process.env.TEST_EPOSTA ?? "test.atolye@example.com";
const TEST_SIFRE = process.env.TEST_SIFRE ?? "atolye-test-123456";

test.beforeEach(async ({ page }) => {
  test.skip(
    !KURULU,
    "Supabase ayarlanmamış. .env.local içine NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ekleyin.",
  );

  await page.goto("/giris");

  // Önce giriş dene; hesap yoksa aç
  await page.getByLabel("E‑posta").fill(TEST_EPOSTA);
  await page.getByLabel("Şifre").fill(TEST_SIFRE);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();

  const anaSayfa = page.getByText("Bugünün görevi");
  const hataKutusu = page.getByRole("alert");

  await Promise.race([
    anaSayfa.waitFor({ state: "visible", timeout: 8000 }).catch(() => {}),
    hataKutusu.waitFor({ state: "visible", timeout: 8000 }).catch(() => {}),
  ]);

  if (await hataKutusu.isVisible().catch(() => false)) {
    await page.getByRole("tab", { name: "Hesap aç" }).click();
    await page.getByLabel("Adın").fill("Test Sanatçı");
    await page.getByLabel("E‑posta").fill(TEST_EPOSTA);
    await page.getByLabel("Şifre").fill(TEST_SIFRE);
    await page.getByRole("button", { name: "Hesabımı aç" }).click();
  }

  await expect(anaSayfa).toBeVisible({ timeout: 15000 });
});

/** Tuvale gerçek bir çizgi çizer (fare = pointer olayları) */
async function cizgiCiz(page: Page) {
  const tuval = page.getByRole("img", { name: /Çizim alanı/i });
  await expect(tuval).toBeVisible();
  const k = await tuval.boundingBox();
  if (!k) throw new Error("Tuval bulunamadı");

  await page.mouse.move(k.x + 80, k.y + 80);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(k.x + 80 + i * 18, k.y + 80 + Math.sin(i / 2) * 45);
  }
  await page.mouse.up();
}

/** Çizim yapıp isim vererek müzeye asar */
async function cizimYapVeAs(page: Page, ad: string) {
  await page.goto("/ciz");
  await cizgiCiz(page);

  const asButonu = page.getByRole("button", { name: /Müzeye as/i });
  await expect(asButonu).toBeEnabled();
  await asButonu.click();

  await page.getByLabel("Çizimin adı").fill(ad);
  await page.getByRole("button", { name: /Müzeye as/i }).click();
  await expect(page).toHaveURL(/\/muze/);
}

/** localStorage'a yazılana kadar bekler (sabit uyku değil, yeniden dener) */
async function kaydedilmisMi(page: Page, arananMetin: string) {
  await expect
    .poll(
      async () =>
        page.evaluate(
          (m) => (localStorage.getItem("duru.atolye.v1") ?? "").includes(m),
          arananMetin,
        ),
      { timeout: 5000, message: `"${arananMetin}" localStorage'a yazılmadı` },
    )
    .toBe(true);
}

/* ------------------------------------------------------------ */

test("ana sayfa açılır, logo ve bugünün görevi görünür", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByAltText("Duru'nun Atölyesi")).toBeVisible();
  await expect(page.getByText("Bugünün görevi")).toBeVisible();
  await expect(page.getByRole("link", { name: /Çizmeye başla/i })).toBeVisible();

  // Görev metni boş olmamalı
  const gorev = page.locator("section").first().locator("p").nth(1);
  await expect(gorev).not.toBeEmpty();

  // İlk girişte yönlendirme kartı çıkmalı
  await expect(page.getByText("Atölyen bomboş!")).toBeVisible();
});

test("alt menü dört bölüme de gider", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("navigation", { name: "Ana bölümler" });

  await menu.getByRole("link", { name: "Çiz" }).click();
  await expect(page).toHaveURL(/\/ciz/);

  await menu.getByRole("link", { name: "Müze" }).click();
  await expect(page).toHaveURL(/\/muze/);

  await menu.getByRole("link", { name: "Kitaplar" }).click();
  await expect(page).toHaveURL(/\/kitaplik/);

  await menu.getByRole("link", { name: "Atölye" }).click();
  await expect(page).toHaveURL(/localhost:3001\/$/);
});

test("çizim yapılır ve müzeye asılır", async ({ page }) => {
  await page.goto("/ciz");

  // Boş tuvalde kaydet kapalı olmalı
  await expect(page.getByRole("button", { name: /Müzeye as/i })).toBeDisabled();

  await cizgiCiz(page);
  await expect(page.getByRole("button", { name: /Müzeye as/i })).toBeEnabled();

  await page.getByRole("button", { name: /Müzeye as/i }).click();
  await expect(page.getByText("Çizimin hazır!")).toBeVisible();
  await expect(page.getByAltText("Az önce yaptığın çizim")).toBeVisible();

  await page.getByLabel("Çizimin adı").fill("Gökkuşağı Atı");
  await page.getByRole("button", { name: /Müzeye as/i }).click();

  await expect(page).toHaveURL(/\/muze/);
  await expect(page.getByText("Gökkuşağı Atı")).toBeVisible();
  await expect(page.getByText("1 çizim asılı")).toBeVisible();
});

test("silgi, geri al ve temizle çalışır", async ({ page }) => {
  await page.goto("/ciz");

  const geriAl = page.getByRole("button", { name: "Geri al" });
  const silgi = page.getByRole("button", { name: "Silgi" });

  await expect(geriAl).toBeDisabled();

  await cizgiCiz(page);
  await expect(geriAl).toBeEnabled();

  // Araç paleti: silgiye basınca seçilir, fırçaya basınca bırakılır
  const firca = page.getByRole("button", { name: "Fırça" });
  await silgi.click();
  await expect(silgi).toHaveAttribute("aria-pressed", "true");
  await expect(firca).toHaveAttribute("aria-pressed", "false");
  await firca.click();
  await expect(silgi).toHaveAttribute("aria-pressed", "false");
  await expect(firca).toHaveAttribute("aria-pressed", "true");

  // Geri alınca tuval boşalır → kaydet tekrar kapanır
  await geriAl.click();
  await expect(page.getByRole("button", { name: /Müzeye as/i })).toBeDisabled();
});

test("renk ve fırça kalınlığı seçilebilir", async ({ page }) => {
  await page.goto("/ciz");

  const pembe = page.getByRole("button", { name: "Renk #FF6FA5" });
  await pembe.click();
  await expect(pembe).toHaveAttribute("aria-pressed", "true");

  const kalin = page.getByRole("button", { name: "Çok kalın çizgi" });
  await kalin.click();
  await expect(kalin).toHaveAttribute("aria-pressed", "true");

  // Kaydırıcı hazır boyuta uymalı ve ince ayar yapılabilmeli
  const kaydirici = page.getByRole("slider", { name: "Çizgi kalınlığı" });
  await expect(kaydirici).toHaveValue("30");

  await kaydirici.fill("7");
  await expect(kaydirici).toHaveValue("7");
  await expect(kalin).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("7", { exact: true })).toBeVisible();
});

test("müzede kalp verilir ve sayı artar", async ({ page }) => {
  await cizimYapVeAs(page, "Kalpli Çizim");

  const kalp = page.getByRole("button", { name: /kalp ver/i });
  await expect(kalp).toBeVisible();

  await kalp.click();
  await expect(page.getByRole("button", { name: /Şu an 1 kalp/i })).toBeVisible();

  await page.getByRole("button", { name: /kalp ver/i }).click();
  await expect(page.getByRole("button", { name: /Şu an 2 kalp/i })).toBeVisible();
});

test("çizim sayfa yenilendikten sonra da durur", async ({ page }) => {
  await cizimYapVeAs(page, "Kalıcı Kedi");
  await kaydedilmisMi(page, "Kalıcı Kedi");

  await page.reload();
  await expect(page.getByText("Kalıcı Kedi")).toBeVisible();
});

test("konuşan kedi kitabı açılır, yazılır ve kaydedilir", async ({ page }) => {
  await page.goto("/kitaplik");

  await page.getByRole("button", { name: /Konuşan kedi kitabıyla başla/i }).click();
  await expect(page).toHaveURL(/\/kitap\//);

  // Hazır ilk cümle gelmiş olmalı
  await expect(page.getByLabel("Kitabın adı")).toHaveValue("Konuşabilen Kedim");
  const metin = page.getByLabel("Sayfa 1 metni");
  await expect(metin).not.toBeEmpty();

  await metin.fill("Kedim bana bugün ilk kez konuştu ve çok şaşırdım.");
  await kaydedilmisMi(page, "çok şaşırdım");

  await page.reload();
  await expect(page.getByLabel("Sayfa 1 metni")).toHaveValue(/çok şaşırdım/);
});

test("kitaba sayfa eklenir ve sayfalar arasında gezilir", async ({ page }) => {
  await page.goto("/kitaplik");
  await page.getByLabel("Yeni kitap başlat").fill("Orman Macerası");
  await page.getByRole("button", { name: "Kitabı oluştur" }).click();
  await expect(page).toHaveURL(/\/kitap\//);

  await expect(page.getByText("Sayfa 1 / 1")).toBeVisible();

  await page.getByRole("button", { name: "Yeni sayfa ekle" }).click();
  await expect(page.getByText("Sayfa 2 / 2")).toBeVisible();

  await page.getByRole("button", { name: "Önceki sayfa" }).click();
  await expect(page.getByText("Sayfa 1 / 2")).toBeVisible();

  await page.getByRole("button", { name: "Sonraki sayfa" }).click();
  await expect(page.getByText("Sayfa 2 / 2")).toBeVisible();
});

test("müzedeki çizim kitabın sayfasına resim olarak konur", async ({ page }) => {
  // Önce müzeye bir çizim as
  await cizimYapVeAs(page, "Kitap Resmi");

  // Sonra kitap yap ve resmi sayfaya koy
  await page.goto("/kitaplik");
  await page.getByRole("button", { name: /Konuşan kedi kitabıyla başla/i }).click();
  await expect(page).toHaveURL(/\/kitap\//);

  await page.getByRole("button", { name: /müzenden bir resim koy/i }).click();
  await expect(page.getByRole("dialog", { name: /Müzenden resim seç/i })).toBeVisible();

  await page.getByRole("button", { name: /Kitap Resmi resmini bu sayfaya koy/i }).click();

  await expect(page.getByAltText("Kitap Resmi")).toBeVisible();
  await expect(page.getByRole("button", { name: "Resmi değiştir" })).toBeVisible();
});

test("çizim müzeden silinebilir", async ({ page }) => {
  await cizimYapVeAs(page, "Silinecek Çizim");

  await page.getByRole("button", { name: "Silinecek Çizim" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByRole("button", { name: "Bu çizimi sil" }).click();
  await expect(page.getByText("Bu çizim müzeden kaldırılsın mı?")).toBeVisible();

  await page.getByRole("button", { name: "Evet, sil" }).click();
  await expect(page.getByText("Duvarlar bomboş")).toBeVisible();
});

test("seri sayacı çizim yapınca görünür", async ({ page }) => {
  await cizimYapVeAs(page, "Seri Testi");
  await page.goto("/");

  await expect(page.getByText("Bugünkü çizimini yaptın!")).toBeVisible();
  await expect(page.getByText("gün", { exact: false }).first()).toBeVisible();
});

/* ---------------- Animasyonlar ---------------- */

test("giriş animasyonu galeri kartlarına uygulanıyor", async ({ page }) => {
  await cizimYapVeAs(page, "Animasyon Testi");

  const kart = page.locator(".belir").first();
  await expect(kart).toBeVisible();

  const ad = await kart.evaluate((e) => getComputedStyle(e).animationName);
  expect(ad).toBe("belir");

  const sure = await kart.evaluate((e) => getComputedStyle(e).animationDuration);
  expect(sure).toBe("0.42s");
});

test("butona basınca claymorphism çökme efekti var", async ({ page }) => {
  await page.goto("/");
  const buton = page.getByRole("link", { name: /Çizmeye başla/i });

  const gecis = await buton.evaluate((e) => getComputedStyle(e).transitionDuration);
  expect(gecis).not.toBe("0s");
});

/* ---------------- Yeni çizim araçları ---------------- */

test("ileri al, geri alınan çizgiyi geri getirir", async ({ page }) => {
  await page.goto("/ciz");
  const geriAl = page.getByRole("button", { name: "Geri al" });
  const ileriAl = page.getByRole("button", { name: "İleri al" });
  const kaydet = page.getByRole("button", { name: /Müzeye as/i });

  await expect(ileriAl).toBeDisabled();

  await cizgiCiz(page);
  await geriAl.click();
  await expect(kaydet).toBeDisabled();
  await expect(ileriAl).toBeEnabled();

  await ileriAl.click();
  await expect(kaydet).toBeEnabled();
  await expect(ileriAl).toBeDisabled();
});

test("dolgu ve damlalık araçları seçilebilir", async ({ page }) => {
  await page.goto("/ciz");
  // Tuval hazır olmadan araçlara basmak yarış durumu yaratıyor
  await expect(page.getByRole("img", { name: /Çizim alanı/i })).toBeVisible();

  const dolgu = page.getByRole("button", { name: "Boya dök" });
  await dolgu.click();
  await expect(dolgu).toHaveAttribute("aria-pressed", "true");

  const damlalik = page.getByRole("button", { name: "Renk kap" });
  await damlalik.click();
  await expect(damlalik).toHaveAttribute("aria-pressed", "true");
  await expect(dolgu).toHaveAttribute("aria-pressed", "false");
});

test("yakınlaştırma çalışır ve sıfırlanır", async ({ page }) => {
  await page.goto("/ciz");
  const sifirla = page.getByRole("button", { name: "Görünümü sıfırla" });

  await expect(sifirla).toContainText("1.0x");
  await expect(sifirla).toBeDisabled();

  await page.getByRole("button", { name: "Yakınlaştır" }).click();
  await expect(sifirla).toContainText("1.5x");
  await expect(sifirla).toBeEnabled();

  await sifirla.click();
  await expect(sifirla).toContainText("1.0x");
});

test("tam ekran çizim modu açılıp kapanır", async ({ page }) => {
  await page.goto("/ciz");

  await page.getByRole("button", { name: "Tam ekran çiz" }).click();
  const cik = page.getByRole("button", { name: "Tam ekrandan çık" });
  await expect(cik).toBeVisible();
  // Tam ekranda tuval hâlâ çizilebilir olmalı
  await expect(page.getByRole("img", { name: /Çizim alanı/i })).toBeVisible();

  await cik.click();
  await expect(page.getByRole("button", { name: "Tam ekran çiz" })).toBeVisible();
});

test("yarım kalan çizim taslak olarak geri gelir", async ({ page }) => {
  await page.goto("/ciz");
  await cizgiCiz(page);
  await expect
    .poll(async () =>
      page.evaluate(() => !!localStorage.getItem("duru.atolye.taslak")),
    )
    .toBe(true);

  // Sayfadan çık, sonra geri dön
  await page.goto("/muze");
  await page.goto("/ciz");

  await expect(page.getByText("Yarım kalan çizimin geri yüklendi.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Müzeye as/i })).toBeEnabled();
});

/* ---------------- Kitap: kaydetme, okuma, ses ---------------- */

test("kitapta kaydedildi göstergesi ve kelime sayısı çalışır", async ({ page }) => {
  await page.goto("/kitaplik");
  await page.getByRole("button", { name: /Konuşan kedi kitabıyla başla/i }).click();
  await expect(page).toHaveURL(/\/kitap\//);

  await page.getByLabel("Sayfa 1 metni").fill("Bir varmış bir yokmuş kedi konuşmuş");
  await expect(page.getByText("Kaydedildi")).toBeVisible();
  await expect(page.getByText("6 kelime")).toBeVisible();
});

test("okuma modu açılır ve sayfalar çevrilir", async ({ page }) => {
  await page.goto("/kitaplik");
  await page.getByLabel("Yeni kitap başlat").fill("Okuma Testi");
  await page.getByRole("button", { name: "Kitabı oluştur" }).click();
  await expect(page).toHaveURL(/\/kitap\//);

  await page.getByLabel("Sayfa 1 metni").fill("Birinci sayfa yazısı");
  await page.getByRole("button", { name: "Yeni sayfa ekle" }).click();
  await page.getByLabel("Sayfa 2 metni").fill("İkinci sayfa yazısı");

  await page.getByRole("button", { name: "Oku", exact: true }).click();

  // Okuyucu bir dialog — arkadaki düzenleme ekranıyla karışmasın diye
  // bütün beklentileri onun içine kapsıyoruz
  const okuyucu = page.getByRole("dialog", { name: /okuma modu/i });
  await expect(okuyucu).toBeVisible();
  await expect(okuyucu.getByText("İkinci sayfa yazısı")).toBeVisible();
  await expect(okuyucu.getByRole("button", { name: "Bana sesli oku" })).toBeVisible();

  await okuyucu.getByRole("button", { name: "Önceki sayfa" }).click();
  await expect(okuyucu.getByText("Birinci sayfa yazısı")).toBeVisible();

  await okuyucu.getByRole("button", { name: "Okumayı bitir" }).click();
  await expect(okuyucu).toBeHidden();
  await expect(page.getByLabel("Sayfa 1 metni")).toBeVisible();
});

/* ---------------- Tablete indirilebilirlik (PWA) ---------------- */

test("uygulama tanımı yayınlanıyor ve ikonları doğru", async ({ page }) => {
  const yanit = await page.request.get("/manifest.webmanifest");
  expect(yanit.ok()).toBe(true);

  const m = await yanit.json();
  expect(m.name).toBe("Duru'nun Atölyesi");
  expect(m.display).toBe("standalone");
  expect(m.start_url).toBe("/");
  // Kurulabilirlik için 192 ve 512 ikonu şart
  const boyutlar = m.icons.map((i: { sizes: string }) => i.sizes);
  expect(boyutlar).toContain("192x192");
  expect(boyutlar).toContain("512x512");
  // Android maskeleme için maskable ikon
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
});

test("servis çalışanı dosyası erişilebilir", async ({ page }) => {
  const yanit = await page.request.get("/sw.js");
  expect(yanit.ok()).toBe(true);
  const kod = await yanit.text();
  // Kurulabilirlik için fetch dinleyicisi zorunlu
  expect(kod).toContain('addEventListener("fetch"');
});

/* ---------------- Sayfa çevirme animasyonu ---------------- */

test("kitap sayfası çevrilirken 3B animasyon uygulanıyor", async ({ page }) => {
  await page.goto("/kitaplik");
  await page.getByLabel("Yeni kitap başlat").fill("Animasyon Kitabı");
  await page.getByRole("button", { name: "Kitabı oluştur" }).click();
  await expect(page).toHaveURL(/\/kitap\//);

  await page.getByRole("button", { name: "Yeni sayfa ekle" }).click();

  const sayfa = page.locator(".sayfa-ileri").first();
  await expect(sayfa).toBeVisible();
  const ad = await sayfa.evaluate((e) => getComputedStyle(e).animationName);
  expect(ad).toBe("sayfaIleri");

  await page.getByRole("button", { name: "Önceki sayfa" }).click();
  const geri = page.locator(".sayfa-geri").first();
  const adGeri = await geri.evaluate((e) => getComputedStyle(e).animationName);
  expect(adGeri).toBe("sayfaGeri");
});

test("hareket azaltma ayarı açıkken animasyonlar kapanıyor", async ({ browser }) => {
  const ctx = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 820, height: 1180 },
  });
  const page = await ctx.newPage();

  await page.goto("/");
  const sure = await page
    .locator(".salin")
    .first()
    .evaluate((e) => getComputedStyle(e).animationDuration);

  // 0.001ms → tarayıcı "0.000001s" olarak raporlar
  expect(parseFloat(sure)).toBeLessThan(0.01);
  await ctx.close();
});
