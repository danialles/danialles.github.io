import type { APIRoute } from 'astro';

// Absolute sitemap URL comes from `site` in astro.config — never hardcode the domain.
export const GET: APIRoute = ({ site }) => {
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site)}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
