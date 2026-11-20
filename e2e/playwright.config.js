import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  expect: { timeout: 12000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }], ['junit', { outputFile: 'test-results/results.xml' }]],
  use: { baseURL: 'http://127.0.0.1:5173', screenshot: 'only-on-failure', trace: 'retain-on-failure', video: 'on' },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
    cwd: '../frontend',
    env: { VITE_API_URL: 'http://127.0.0.1:5173/api', VITE_SEAT_API_URL: 'http://127.0.0.1:5173/api/asientos' },
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 120000
  }
});
