import { describe, expect, it } from 'vitest';
import { contactLinks } from '../../src/lib/contacts';

describe('contactLinks', () => {
  it('returns Telegram, MAX, phone and mailto in that order when all are set', () => {
    const links = contactLinks({ telegram: 'https://t.me/x', max: 'https://max.ru/x', phone: '+7 958 546-64-92', email: 'a@b.ru' });
    expect(links.map((l) => l.kind)).toEqual(['telegram', 'max', 'phone', 'email']);
    expect(links[3].href).toBe('mailto:a@b.ru');
    expect(links.map((l) => l.label)).toEqual(['Telegram', 'MAX', 'Позвонить', 'Почта']);
  });

  it('strips the spacing out of a phone number so the tel: link dials', () => {
    const [link] = contactLinks({ telegram: '', max: '', phone: '+7 958 546-64-92', email: '' });
    expect(link.href).toBe('tel:+79585466492');
  });

  it('skips channels that are not configured', () => {
    const links = contactLinks({ telegram: 'https://t.me/x', max: '', phone: '', email: '' });
    expect(links).toHaveLength(1);
    expect(links[0].kind).toBe('telegram');
  });
});
