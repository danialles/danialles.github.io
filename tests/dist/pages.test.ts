import { describe, expect, it } from 'vitest';
import { html } from './helpers';

describe('home page', () => {
  const $ = html('index.html');

  it('is built with Russian lang and the offer headline', () => {
    expect($('html').attr('lang')).toBe('ru');
    expect($('h1').first().text()).toContain('Сайты, сервисы и Telegram-боты');
  });

  it('links to the CV from the footer and shows the Telegram button', () => {
    expect($('footer a[href="/cv/"]').text()).toBe('Резюме');
    expect($('[data-contact="telegram"]').first().attr('href')).toMatch(/^https:\/\/t\.me\//);
  });

  it('has every section from the spec in order', () => {
    const ids = $('main section[id]').map((_, el) => $(el).attr('id')).get();
    expect(ids).toEqual(['services', 'cases', 'process', 'maintenance', 'tech', 'contacts']);
  });

  it('shows four service cards and the bots list', () => {
    expect($('#services article').length).toBe(4);
    expect($('#services [data-bots] li').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the published cases in grid order without drafts', () => {
    const hrefs = $('#cases a[href^="/cases/"]').map((_, el) => $(el).attr('href')).get();
    expect(hrefs[0]).toBe('/cases/illoca/');
    expect(hrefs).not.toContain('/cases/skbereg/');
  });

  it('never mentions prices', () => {
    expect($('main').text()).not.toMatch(/₽|руб\.|от \d+ ?000/);
  });
});
