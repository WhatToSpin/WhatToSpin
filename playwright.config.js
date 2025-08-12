import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false, // dont run tests in parallel
  workers: 1, // for test ordering
  retries: 1,
  reporter: 'html',
  use: {
    headless: false,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'electron',
      use: {
        launchOptions: {
          executablePath: './node_modules/.bin/electron',
          args: ['./src/main.js'],
        },
      },
    },
  ],
});