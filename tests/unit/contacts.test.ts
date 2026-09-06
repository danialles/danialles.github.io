import { describe, expect, it } from 'vitest';
import { contactLinks } from '../../src/lib/contacts';

describe('contactLinks', () => {
  it('returns Telegram, MAX and mailto in that order when all are set', () => {
    const links = contactLinks({ telegram: 'https://t.me/x', max: 'https://max.ru/u/x', email: 'a@b.ru' });
    expect(links.map((l) => l.kind)).toEqual(['telegram', 'max', 'email']);
    expect(links[2].href).toBe('mailto:a@b.ru');
    expect(links.map((l) => l.label)).toEqual(['Telegram', 'MAX', 'Почта']);
  });

  it('skips channels that are not configured', () => {
    const links = contactLinks({ telegram: 'https://t.me/x', max: '', email: '' });
    expect(links).toHaveLength(1);
    expect(links[0].kind).toBe('telegram');
  });
});
