// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import site from './site.config.mjs';

export default defineConfig({
  site: site.site,
  integrations: [react(), sitemap()],
  // The whole site shares one stylesheet: ~19 KB raw, ~5 KB gzipped, inlined into every
  // page. That removes the render-blocking request that was holding first paint back;
  // revisit the trade-off if the sheet grows past ~30 KB raw.
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
