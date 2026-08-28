import { test, expect, type Page } from "@playwright/test";

/* ============================================================
   DURU'NUN ATÖLYESİ — uçtan uca testler
   Veriler artık Supabase'de. Testler gerçek bir hesapla,
   gerçek veritabanına karşı çalışır.
   ============================================================ */

/* Oturum, "kurulum" projesinde bir kez açılıp dosyaya kaydediliyor
   (bkz. tests/oturum.setup.ts ve playwright.config.ts). Testler o
   oturumu paylaşır — Supabase'in kimlik doğrulama hız sınırına
   takılmamak için.

   Hesap paylaşıldığı için veriler testler arasında birikir. Bu yüzden
   her test KENDİ benzersiz adıyla veri üretir ve sadece onu doğrular;
   "müze bomboş" gibi mutlak varsayımlar kullanılmaz. */

function benzersiz(on: string): string {
  return `${on}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
}

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

/** Sayfayı yenileyip metnin gerçekten sunucudan geldiğini doğrular.
    Eski sürümde localStorage okunuyordu; artık tek kaynak Supabase. */
async function yenileVeDogrula(page: Page, metin: string | RegExp) {
  await page.reload();
  await expect(page.getByText(metin).first()).toBeVisible({ timeout: 20000 });
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

  // Müze ve kitaplık kapıları görünmeli
  await expect(page.getByRole("link", { name: /Müzem/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Kitaplarım/ })).toBeVisible();
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
  await expect(page.getByText("Bugünün görevi")).toBeVisible();

  await menu.getByRole("link", { name: "Ben" }).click();
  await expect(page).toHaveURL(/\/ben/);
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

  const ad = benzersiz("Gökkuşağı Atı");
  await page.getByLabel("Çizimin adı").fill(ad);
  await page.getByRole("button", { name: /Müzeye as/i }).click();

  // Kutlama ekranı, sonra müze
  await expect(page.getByText("Müzene asıldı!")).toBeVisible({ timeout: 25000 });
  await expect(page).toHaveURL(/\/muze/, { timeout: 15000 });
  await expect(page.getByText(ad)).toBeVisible({ timeout: 20000 });
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
  const ad = benzersiz("Kalpli Çizim");
  await cizimYapVeAs(page, ad);

  // Sadece BU çizimin kalbine bas — müzede başka çizimler de var
  const kalp = page.getByRole("button", { name: new RegExp(`^${ad} çizimine kalp ver`) });
  await expect(kalp).toBeVisible({ timeout: 20000 });

  await kalp.click();
  await expect(
    page.getByRole("button", { name: new RegExp(`${ad}.*Şu an 1 kalp`) }),
  ).toBeVisible();

  await page.getByRole("button", { name: new RegExp(`^${ad} çizimine kalp ver`) }).click();
  await expect(
    page.getByRole("button", { name: new RegExp(`${ad}.*Şu an 2 kalp`) }),
  ).toBeVisible();
});

test("çizim veritabanına kaydedilir, yenileyince durur", async ({ page }) => {
  const ad = benzersiz("Kalıcı Kedi");
  await cizimYapVeAs(page, ad);

  // Yenileme sunucudan taze veri çeker — gerçekten kaydedildiğinin kanıtı
  await yenileVeDogrula(page, ad);
});

test("kitap yazılır, kaydedilir ve yenileyince metin durur", async ({ page }) => {
  const kitapAdi = benzersiz("Konuşabilen Kedim");
  await page.goto("/kitaplik");
  await page.getByLabel("Yeni kitap başlat").fill(kitapAdi);
  await page.getByRole("button", { name: "Kitabı oluştur" }).click();
  await expect(page).toHaveURL(/\/kitap\//, { timeout: 20000 });

  await expect(page.getByLabel("Kitabın adı")).toHaveValue(kitapAdi);

  const cumle = `Kedim bana bugün ilk kez konuştu ${Date.now()}`;
  await page.getByLabel("Sayfa 1 metni").fill(cumle);
  await expect(page.getByText("Kaydedildi")).toBeVisible({ timeout: 15000 });

  await page.reload();
  await expect(page.getByLabel("Sayfa 1 metni")).toHaveValue(cumle, { timeout: 20000 });
});

test("kitaba sayfa eklenir ve sayfalar arasında gezilir", async ({ page }) => {
  await page.goto("/kitaplik");
  await page.getByLabel("Yeni kitap başlat").fill(benzersiz("Orman Macerası"));
  await page.getByRole("button", { name: "Kitabı oluştur" }).click();
  await expect(page).toHaveURL(/\/kitap\//, { timeout: 20000 });

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
  const resimAdi = benzersiz("Kitap Resmi");
  await cizimYapVeAs(page, resimAdi);

  // Sonra kitap yap ve resmi sayfaya koy
  await page.goto("/kitaplik");
  await page.getByLabel("Yeni kitap başlat").fill(benzersiz("Resimli Kitap"));
  await page.getByRole("button", { name: "Kitabı oluştur" }).click();
  await expect(page).toHaveURL(/\/kitap\//, { timeout: 20000 });

  await page.getByRole("button", { name: /müzenden bir resim koy/i }).click();
  const secici = page.getByRole("dialog", { name: /Müzenden resim seç/i });
  await expect(secici).toBeVisible();

  await secici
    .getByRole("button", { name: new RegExp(`^${resimAdi} resmini bu sayfaya koy`) })
    .click();

  await expect(page.getByAltText(resimAdi)).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("button", { name: "Resmi değiştir" })).toBeVisible();
});

test("çizim müzeden silinebilir", async ({ page }) => {
  const ad = benzersiz("Silinecek Çizim");
  await cizimYapVeAs(page, ad);

  await page.getByRole("button", { name: ad, exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByRole("button", { name: "Bu çizimi sil" }).click();
  await expect(page.getByText("Bu çizim müzeden kaldırılsın mı?")).toBeVisible();

  await page.getByRole("button", { name: "Evet, sil" }).click();

  // Sadece BU çizim gitmeli — müzedeki diğerleri yerinde kalır
  await expect(page.getByText(ad)).toBeHidden({ timeout: 20000 });
  await yenileVeDogrula(page, "çizim asılı");
  await expect(page.getByText(ad)).toBeHidden();
});

test("seri sayacı çizim yapınca görünür", async ({ page }) => {
  await cizimYapVeAs(page, benzersiz("Seri Testi"));
  await page.goto("/");

  await expect(page.getByText("Bugünkü çizimini yaptın!")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("gün", { exact: false }).first()).toBeVisible();
});

/* ---------------- Animasyonlar ---------------- */

test("giriş animasyonu galeri kartlarına uygulanıyor", async ({ page }) => {
  await cizimYapVeAs(page, benzersiz("Animasyon Testi"));

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
