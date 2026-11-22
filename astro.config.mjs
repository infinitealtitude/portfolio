import { defineConfig, passthroughImageService } from 'astro/config';
import { getSiteConfig } from './src/lib/site-config.mjs';

const { base, origin } = getSiteConfig();

export default defineConfig({
  site: origin,
  base,
  output: 'static',
  build: { format: 'file' },
  image: { service: passthroughImageService() },
  devToolbar: { enabled: false },
});
