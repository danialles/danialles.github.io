import { useEffect, useRef, useState } from 'react';

export interface Shot {
  thumb: string;
  full: string;
  width: number;
  height: number;
  alt: string;
}

// The only client-side island on the site: thumbnails + a lightbox with keyboard navigation.
export default function Gallery({ shots }: { shots: Shot[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const count = shots.length;

  // The element that opened the dialog, so we can hand focus back to it on close.
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const openAt = (i: number) => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(i);
  };

  const close = () => {
    setOpen(null);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (open === null) return;
    // Move focus into the dialog once it mounts.
    closeBtnRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? null : (i + 1) % count));
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? null : (i - 1 + count) % count));
      if (e.key === 'Tab') {
        // Trap Tab/Shift+Tab inside the dialog's own buttons (close + prev/next, when present).
        const focusable = [closeBtnRef.current, prevBtnRef.current, nextBtnRef.current].filter(
          (el): el is HTMLButtonElement => el !== null,
        );
        if (focusable.length === 0) return;
        e.preventDefault();
        const current = focusable.indexOf(document.activeElement as HTMLButtonElement);
        const step = e.shiftKey ? -1 : 1;
        const next = (current + step + focusable.length) % focusable.length;
        focusable[next]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, count]);

  if (count === 0) return null;

  const navButton = 'absolute top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-2 text-3xl text-white hover:bg-white/20';

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {shots.map((shot, i) => (
          <li key={shot.full}>
            <button
              type="button"
              onClick={() => openAt(i)}
              aria-label={`Открыть: ${shot.alt}`}
              className="block aspect-[4/3] w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 transition hover:border-neutral-400"
            >
              <img src={shot.thumb} alt={shot.alt} loading="lazy" className="h-full w-full object-cover object-top" />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={shots[open].alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 p-4"
          onClick={close}
        >
          <img
            src={shots[open].full}
            alt={shots[open].alt}
            className="max-h-full max-w-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button type="button" aria-label="Закрыть" ref={closeBtnRef} onClick={close} className="absolute right-4 top-4 text-3xl text-white">×</button>
          {count > 1 && (
            <>
              <button type="button" aria-label="Предыдущий" ref={prevBtnRef} className={`${navButton} left-4`}
                onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + count) % count); }}>‹</button>
              <button type="button" aria-label="Следующий" ref={nextBtnRef} className={`${navButton} right-4`}
                onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % count); }}>›</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
