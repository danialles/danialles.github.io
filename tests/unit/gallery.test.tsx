// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Gallery, { type Shot } from '../../src/components/cases/Gallery';

const shots: Shot[] = [
  { thumb: '/t1.webp', full: '/f1.webp', width: 640, height: 400, fullWidth: 1600, fullHeight: 1000, alt: 'Первый' },
  { thumb: '/t2.webp', full: '/f2.webp', width: 640, height: 400, fullWidth: 1600, fullHeight: 1000, alt: 'Второй' },
];

afterEach(cleanup);

describe('Gallery', () => {
  it('renders nothing for an empty list', () => {
    const { container } = render(<Gallery shots={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('opens the lightbox on click, steps with arrows, closes on Escape', () => {
    render(<Gallery shots={shots} />);
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Открыть: Первый' }));
    expect(screen.getByRole('dialog').querySelector('img')?.getAttribute('src')).toBe('/f1.webp');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('dialog').querySelector('img')?.getAttribute('src')).toBe('/f2.webp');

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('dialog').querySelector('img')?.getAttribute('src')).toBe('/f1.webp');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('gives the thumbnail its own size and the lightbox the full-size one', () => {
    render(<Gallery shots={shots} />);
    const thumb = screen.getByRole('button', { name: 'Открыть: Первый' }).querySelector('img');
    expect([thumb?.getAttribute('width'), thumb?.getAttribute('height')]).toEqual(['640', '400']);

    fireEvent.click(screen.getByRole('button', { name: 'Открыть: Первый' }));
    const full = screen.getByRole('dialog').querySelector('img');
    expect([full?.getAttribute('width'), full?.getAttribute('height')]).toEqual(['1600', '1000']);
  });

  it('locks the page scroll while the lightbox is open and restores it on close', () => {
    document.body.style.overflow = 'auto';
    render(<Gallery shots={shots} />);

    fireEvent.click(screen.getByRole('button', { name: 'Открыть: Первый' }));
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.body.style.overflow).toBe('auto');
  });

  it('moves focus into the dialog on open and restores it on close', () => {
    render(<Gallery shots={shots} />);
    const trigger = screen.getByRole('button', { name: 'Открыть: Первый' });
    trigger.focus();

    fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Закрыть' }));

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
  });

  it('does not steal focus back to the close button on arrow-key navigation', () => {
    render(<Gallery shots={shots} />);
    fireEvent.click(screen.getByRole('button', { name: 'Открыть: Первый' }));

    const nextButton = screen.getByRole('button', { name: 'Следующий' });
    nextButton.focus();
    expect(document.activeElement).toBe(nextButton);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(nextButton);
  });
});
