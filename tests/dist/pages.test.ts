import { describe, expect, it } from 'vitest';
import { exists, html } from './helpers';

describe('home page', () => {
  it('is built with Russian lang and the offer headline', () => {
    expect(exists('index.html')).toBe(true);
    const $ = html('index.html');
    expect($('html').attr('lang')).toBe('ru');
    expect($('h1').first().text()).toContain('Сайты, сервисы и Telegram-боты');
  });

  it('links to the CV from the footer and shows the Telegram button', () => {
    const $ = html('index.html');
    expect($('footer a[href="/cv/"]').text()).toBe('Резюме');
    expect($('[data-contact="telegram"]').attr('href')).toMatch(/^https:\/\/t\.me\//);
  });
});
