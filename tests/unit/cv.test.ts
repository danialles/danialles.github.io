import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCv, parseCv } from '../../src/lib/cv';
import { FORBIDDEN } from '../forbidden';
import site from '../../site.config.mjs';

describe('parseCv', () => {
  it('rejects a document without a name', () => {
    expect(() => parseCv('headline: x\nsummary: y\n')).toThrow();
  });
});

describe('src/data/cv.yaml', () => {
  const cv = loadCv();

  it('validates against the schema and keeps the fixed headline', () => {
    expect(cv.headline).toBe('Fullstack-разработчик · Rust / React / Go / PHP');
    expect(cv.stack.length).toBeGreaterThanOrEqual(3);
  });

  it('writes experience in the past tense', () => {
    // No `\b` here: JS word boundaries are ASCII-only and never fire around Cyrillic letters.
    const presentTense = /(^|[^а-яё])(сейчас|работаю|делаю|занимаюсь)([^а-яё]|$)|в настоящее время/i;
    for (const job of cv.experience) {
      for (const point of job.points) expect(point, point).not.toMatch(presentTense);
    }
    for (const line of cv.projects.map((p) => p.line)) expect(line, line).not.toMatch(presentTense);
  });

  it('keeps its contacts in sync with site.config.mjs', () => {
    expect(cv.contacts.site).toBe(site.site);
    expect(cv.contacts.telegram).toBe(site.telegram);
    expect(cv.contacts.github).toBe(site.github);
    expect(cv.contacts.phone).toBe(site.phone);
    expect(cv.contacts.email).toBe(site.email);
  });
});

describe('résumé sources', () => {
  // The PDF is compiled straight from these two files, so the dist HTML guards never see them.
  const SOURCES = ['src/data/cv.yaml', 'cv/resume.typ'];
  const cases = SOURCES.flatMap((rel) => FORBIDDEN.map(([label, pattern]) => [rel, label, pattern] as const));

  it.each(cases)('%s never contains %s', (rel, _label, pattern) => {
    const text = readFileSync(resolve(import.meta.dirname, '../..', rel), 'utf8');
    expect(text).not.toMatch(pattern);
  });
});
