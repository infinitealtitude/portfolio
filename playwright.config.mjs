import { defineConfig } from '@playwright/test';
import { getSiteConfig } from './src/lib/site-config.mjs';

const { base } = getSiteConfig();
const baseURL = new URL(`${base.replace(/\/$/, '')}/`, 'http://127.0.0.1:4173').href;

export default defineConfig({
  testDir: './tests',
  workers: 2,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run check:build && npm run preview -- --host 127.0.0.1 --port 4173 --ignore-lock',
    url: baseURL,
    reuseExistingServer: false,
  },
});
