import { defineConfig, devices } from "@playwright/test";

// Browser tests for rooms: two players in one test, against the Vite dev
// server and the room server from the sibling repo
// (../nintendo-direct-bingo-server, with its dependencies installed).
// `.e2e.ts`, so Vitest doesn't pick them up
export default defineConfig({
  testDir: "e2e",
  testMatch: "*.e2e.ts",
  fullyParallel: true,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:5173",
    // The language comes from the time zone: fix both, or the UI is in
    // Portuguese on a Brazilian machine
    locale: "en-US",
    timezoneId: "America/New_York",
  },
  webServer: [
    {
      command: "npm run dev -- --port 5173 --strictPort",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "node src/main.ts",
      cwd: "../nintendo-direct-bingo-server",
      url: "http://localhost:8080/healthz",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
