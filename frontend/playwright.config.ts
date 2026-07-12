import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false, // Run tests sequentially to avoid local concurrency race conditions
  forbidOnly: !!(globalThis as any).process?.env?.CI,
  retries: 0,
  workers: 1, // Single worker to avoid database document update conflicts on localhost
  reporter: 'list',
  use: {
    actionTimeout: 10000,
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm.cmd run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      cwd: './',
    },
    {
      command: 'node server.js',
      url: 'http://localhost:5000/api/health',
      reuseExistingServer: true,
      cwd: '../backend',
    }
  ]
});
