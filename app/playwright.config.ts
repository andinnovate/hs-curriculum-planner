import { defineConfig } from '@playwright/test'

process.env.FORCE_COLOR = '0'
process.env.NO_COLOR = '1'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    env: {
      FORCE_COLOR: '0',
      NO_COLOR: '1',
    },
  },
})
