import { test as setup, expect } from "@playwright/test";
import path from "node:path";

/* ============================================================
   OTURUM KURULUMU — tüm testlerden ÖNCE bir kez çalışır.

   Neden: her test ayrı giriş yaparsa Supabase kimlik doğrulama
   hız sınırına takılıyor ve testler rastgele düşüyor. Bir kez
   giriş yapıp oturumu dosyaya kaydediyoruz; tüm testler onu
   yeniden kullanıyor.
   ============================================================ */

export const OTURUM_DOSYASI = path.join(
  __dirname,
  "..",
  "playwright",
  ".auth",
  "duru.json",
);

const TEST_EPOSTA = process.env.TEST_EPOSTA ?? "atolye.test.2026@gmail.com";
const TEST_SIFRE = process.env.TEST_SIFRE ?? "atolye-test-123456";

/* Geliştirme sunucusu sayfaları İLK açılışta derliyor; bu 30 saniyeyi
   aşabiliyor. Cömert bir süre veriyoruz, yoksa yavaşlığı hata sanıyoruz. */
setup.setTimeout(180_000);

setup("giriş yap ve oturumu kaydet", async ({ page }) => {
  await page.goto("/giris");

  const eposta = page.getByLabel("E‑posta");
  await expect(eposta).toBeVisible({ timeout: 60_000 });

  await eposta.fill(TEST_EPOSTA);
  await page.getByLabel("Şifre", { exact: true }).fill(TEST_SIFRE);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();

  const gorev = page.getByText("Bugünün görevi");

  /* Tek bir bekleme. Playwright yönlendirmeden sonra konumlandırıcıyı
     yeniden çözer; yarıştırmak gerekmiyor (yarıştırınca yönlendirme
     sırasında bağlam yıkılıyor ve başarılı giriş "hata" sanılıyordu). */
  const girisOldu = await gorev
    .waitFor({ state: "visible", timeout: 45_000 })
    .then(() => true)
    .catch(() => false);

  if (!girisOldu) {
    // Giriş olmadı: büyük ihtimalle hesap yok, açalım
    await page.goto("/giris");
    await page.getByRole("tab", { name: "Hesap aç" }).click();
    await page.getByLabel("Adın").fill("Test Sanatçı");
    await page.getByLabel("E‑posta").fill(TEST_EPOSTA);
    await page.getByLabel("Şifre", { exact: true }).fill(TEST_SIFRE);
    await page.getByRole("button", { name: "Hesabımı aç" }).click();

    const acildi = await gorev
      .waitFor({ state: "visible", timeout: 45_000 })
      .then(() => true)
      .catch(() => false);

    if (!acildi) {
      const mesaj = await page.getByRole("alert").textContent().catch(() => null);
      throw new Error(`Giriş yapılamadı. Ekrandaki mesaj: ${mesaj ?? "(yok)"}`);
    }
  }

  await page.context().storageState({ path: OTURUM_DOSYASI });
});
