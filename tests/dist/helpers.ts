import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { load, type CheerioAPI } from 'cheerio';
import yaml from 'js-yaml';

export const DIST = resolve(import.meta.dirname, '../../dist');
const CASES_DIR = resolve(import.meta.dirname, '../../src/content/cases');

export function exists(relPath: string): boolean {
  return existsSync(resolve(DIST, relPath));
}

export function read(relPath: string): string {
  return readFileSync(resolve(DIST, relPath), 'utf8');
}

export function html(relPath: string): CheerioAPI {
  return load(read(relPath));
}

/** Every .html file under dist/, as paths relative to dist/. */
export function allHtmlFiles(dir = DIST, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return allHtmlFiles(resolve(dir, entry.name), rel);
    return entry.name.endsWith('.html') ? [rel] : [];
  });
}

export interface CaseFrontmatter {
  slug: string;
  title: string;
  draft: boolean;
  nda: boolean;
  url?: string;
}

/** Frontmatter of every case file, so dist tests know which pages must exist. */
export function caseFrontmatters(): CaseFrontmatter[] {
  return readdirSync(CASES_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const text = readFileSync(resolve(CASES_DIR, f), 'utf8');
      const block = text.split(/^---\s*$/m)[1] ?? '';
      const data = yaml.load(block) as Record<string, unknown>;
      return {
        slug: f.replace(/\.md$/, ''),
        title: String(data.title),
        draft: Boolean(data.draft),
        nda: Boolean(data.nda),
        url: typeof data.url === 'string' ? data.url : undefined,
      };
    });
}
