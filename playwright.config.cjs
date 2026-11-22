const { defineConfig } = require('@playwright/test');

const origin = 'http://127.0.0.1:4173';

module.exports = defineConfig({
  testDir: './tests',
  workers: 2,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    baseURL: `${origin}/dist/`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run check:build && python3 -m http.server 4173 --bind 127.0.0.1',
    url: `${origin}/dist/`,
    reuseExistingServer: false,
  },
});
