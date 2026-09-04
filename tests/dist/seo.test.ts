import { describe, expect, it } from 'vitest';
import { allHtmlFiles, exists, html, read } from './helpers';

describe('SEO output', () => {
  it.each(allHtmlFiles().filter((f) => f !== '404.html'))('%s has title, description, absolute canonical and og:image', (file) => {
    const $ = html(file);
    expect($('title').text().length).toBeGreaterThan(10);
    expect($('meta[name="description"]').attr('content')?.length).toBeGreaterThan(20);
    expect($('link[rel="canonical"]').attr('href')).toMatch(/^https:\/\//);
    expect($('meta[property="og:image"]').attr('content')).toMatch(/^https:\/\/.+\/og\/.+\.png$/);
  });

  it('home and cv carry a JSON-LD Person', () => {
    for (const file of ['index.html', 'cv/index.html']) {
      const ld = JSON.parse(html(file)('script[type="application/ld+json"]').first().html() ?? 'null');
      expect(ld?.['@type'], file).toBe('Person');
    }
  });

  it('ships sitemap, robots and 404', () => {
    expect(exists('sitemap-index.xml')).toBe(true);
    expect(read('sitemap-0.xml')).toContain('/cv/');
    expect(read('sitemap-0.xml')).toContain('/cases/illoca/');
    expect(read('robots.txt')).toMatch(/Sitemap: https:\/\/.+\/sitemap-index\.xml/);
    expect(exists('404.html')).toBe(true);
  });
});
