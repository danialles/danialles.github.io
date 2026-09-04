import { describe, expect, it } from 'vitest';
import { personJsonLd } from '../../src/lib/seo';

const site = {
  site: 'https://example.ru',
  name: 'Даниил Есков',
  telegram: 'https://t.me/x',
  github: 'https://github.com/x',
  email: '',
};

describe('personJsonLd', () => {
  it('builds a schema.org Person with sameAs from configured profiles', () => {
    const ld = personJsonLd(site) as Record<string, unknown>;
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Даниил Есков');
    expect(ld.url).toBe('https://example.ru');
    expect(ld.jobTitle).toBe('Fullstack-разработчик');
    expect(ld.sameAs).toEqual(['https://t.me/x', 'https://github.com/x']);
    expect('email' in ld).toBe(false);
  });

  it('adds email only when configured', () => {
    const ld = personJsonLd({ ...site, email: 'a@b.ru' }) as Record<string, unknown>;
    expect(ld.email).toBe('a@b.ru');
  });
});
