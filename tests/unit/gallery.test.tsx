// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Gallery, { type Shot } from '../../src/components/cases/Gallery';

const shots: Shot[] = [
  { thumb: '/t1.webp', full: '/f1.webp', width: 1600, height: 1000, alt: 'Первый' },
  { thumb: '/t2.webp', full: '/f2.webp', width: 1600, height: 1000, alt: 'Второй' },
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

  it('moves focus into the dialog on open and restores it on close', () => {
    render(<Gallery shots={shots} />);
    const trigger = screen.getByRole('button', { name: 'Открыть: Первый' });
    trigger.focus();

    fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Закрыть' }));

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
  });
});
