import { useEffect, useRef, useState } from 'react';

export interface Shot {
  thumb: string;
  full: string;
  /** Intrinsic size of the thumbnail file. */
  width: number;
  height: number;
  /** Intrinsic size of the lightbox file. */
  fullWidth: number;
  fullHeight: number;
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
  // Tracks whether the dialog was already open on the previous render, so initial
  // focus fires once per open — not on every ArrowLeft/ArrowRight index change.
  const wasOpenRef = useRef(false);

  const isOpen = open !== null;

  // The overlay is fixed, so the page underneath kept scrolling on wheel and touch.
  // Restore whatever the document had before, not a hardcoded '': another script may own it.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const openAt = (i: number) => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(i);
  };

  const close = () => {
    setOpen(null);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (open === null) {
      wasOpenRef.current = false;
      return;
    }
    // Move focus into the dialog only on the closed -> open transition, not on
    // every index change while it's already open (ArrowLeft/ArrowRight).
    if (!wasOpenRef.current) closeBtnRef.current?.focus();
    wasOpenRef.current = true;

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

  // A dark chip, not a translucent white one: the arrows sit on top of the picture, and a
  // white glyph on a light screenshot was unreadable. 48 px is also the minimum tap target.
  const dialogButton =
    'flex h-12 w-12 items-center justify-center rounded-full bg-neutral-950/70 text-3xl leading-none text-white hover:bg-neutral-950/90';
  const navButton = `absolute top-1/2 -translate-y-1/2 ${dialogButton}`;

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
              {/* The wrapper's aspect-[4/3] already reserves the box, so these attributes
                  are not the CLS fix: they state the file's intrinsic size, which keeps
                  the picture from collapsing if the stylesheet fails and lets the browser
                  size its decode before the bytes arrive. */}
              <img
                src={shot.thumb}
                alt={shot.alt}
                width={shot.width}
                height={shot.height}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top"
              />
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
            width={shots[open].fullWidth}
            height={shots[open].fullHeight}
            className="max-h-full max-w-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button type="button" aria-label="Закрыть" ref={closeBtnRef} onClick={close} className={`absolute right-4 top-4 ${dialogButton}`}>×</button>
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
