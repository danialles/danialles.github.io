import { describe, expect, it } from 'vitest';
import { escapeXml, ogSvg, wrapLines } from '../../src/lib/og';

describe('escapeXml', () => {
  it('escapes the five XML specials', () => {
    expect(escapeXml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;');
  });
});

describe('wrapLines', () => {
  it('breaks on spaces without exceeding the limit when a word fits', () => {
    expect(wrapLines('Сайты, сервисы и Telegram-боты, которые приносят клиентов', 28)).toEqual([
      'Сайты, сервисы и',
      'Telegram-боты, которые',
      'приносят клиентов',
    ]);
  });

  it('keeps an over-long single word on its own line', () => {
    expect(wrapLines('Суперкалифрагилистикэкспиалидоцmilitant x', 10)).toEqual(['Суперкалифрагилистикэкспиалидоцmilitant', 'x']);
  });
});

describe('ogSvg', () => {
  it('is a 1200×630 SVG with the escaped title and subtitle', () => {
    const svg = ogSvg({ title: 'A & B', subtitle: 'Кейс', site: 'example.ru' });
    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain('A &amp; B');
    expect(svg).toContain('Кейс');
    expect(svg).toContain('example.ru');
  });
});
