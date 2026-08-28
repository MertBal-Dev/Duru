import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      // Duru tabletten kullanacak — testleri de tablet boyutunda ve
      // dokunma destekli çalıştırıyoruz.
      name: "tablet",
      use: {
        browserName: "chromium",
        viewport: { width: 820, height: 1180 },
        hasTouch: true,
      },
    },
  ],
});
