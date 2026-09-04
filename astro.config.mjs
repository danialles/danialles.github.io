// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import site from './site.config.mjs';

export default defineConfig({
  site: site.site,
  integrations: [react(), sitemap()],
  // The whole site shares one ~5 KB stylesheet. Inlining it costs a few kilobytes per
  // page and removes the render-blocking request that was holding first paint back.
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
