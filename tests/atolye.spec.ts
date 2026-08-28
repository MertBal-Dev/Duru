import { test, expect, type Page } from "@playwright/test";

/* ============================================================
   DURU'NUN ATÖLYESİ — uçtan uca testler
   Her test kendi tarayıcı bağlamında çalışır, yani her biri
   bomboş bir localStorage ile başlar. Testler birbirini etkilemez.
   ============================================================ */

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

  // Silgi açılıp kapanabilmeli
  await silgi.click();
  await expect(silgi).toHaveAttribute("aria-pressed", "true");
  await silgi.click();
  await expect(silgi).toHaveAttribute("aria-pressed", "false");

  // Geri alınca tuval boşalır → kaydet tekrar kapanır
  await geriAl.click();
  await expect(page.getByRole("button", { name: /Müzeye as/i })).toBeDisabled();
});

test("renk ve fırça kalınlığı seçilebilir", async ({ page }) => {
  await page.goto("/ciz");

  const pembe = page.getByRole("button", { name: "Renk #FF6FA5" });
  await pembe.click();
  await expect(pembe).toHaveAttribute("aria-pressed", "true");

  const kalin = page.getByRole("button", { name: "Fırça kalınlığı 34" });
  await kalin.click();
  await expect(kalin).toHaveAttribute("aria-pressed", "true");
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
