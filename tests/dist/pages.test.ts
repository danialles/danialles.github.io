import { describe, expect, it } from 'vitest';
import { exists, html } from './helpers';

describe('home page', () => {
  it('is built with Russian lang and the offer headline', () => {
    expect(exists('index.html')).toBe(true);
    const $ = html('index.html');
    expect($('html').attr('lang')).toBe('ru');
    expect($('h1').first().text()).toContain('Сайты, сервисы и Telegram-боты');
  });
});
