import { defineConfig } from "@playwright/test";
import path from "node:path";

const OTURUM = path.join(__dirname, "playwright", ".auth", "duru.json");

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  /* 6 işçide tuval testleri tarayıcıyı çökertiyordu (her biri kendi
     canvas belleğini ayırıyor). 3 işçi hem hızlı hem kararlı. */
  workers: 3,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    // TEST_URL ile canlı siteye karşı da çalıştırılabilir:
    //   $env:TEST_URL="https://durununatolyesi.vercel.app"; npx playwright test
    baseURL: process.env.TEST_URL ?? "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      // Bir kez giriş yapar, oturumu dosyaya yazar
      name: "kurulum",
      testMatch: /oturum\.setup\.ts/,
    },
    {
      // Duru tabletten kullanacak — testleri de tablet boyutunda ve
      // dokunma destekli çalıştırıyoruz. Oturum kurulumdan geliyor.
      name: "tablet",
      dependencies: ["kurulum"],
      use: {
        browserName: "chromium",
        viewport: { width: 820, height: 1180 },
        hasTouch: true,
        storageState: OTURUM,
      },
    },
  ],
});
