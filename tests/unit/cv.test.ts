import { describe, expect, it } from 'vitest';
import { loadCv, parseCv } from '../../src/lib/cv';

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
  });
});
