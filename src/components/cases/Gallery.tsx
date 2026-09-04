import { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? null : (i + 1) % count));
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? null : (i - 1 + count) % count));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
              onClick={() => setOpen(i)}
              aria-label={`Открыть: ${shot.alt}`}
              className="block w-full overflow-hidden rounded-lg border border-neutral-200 transition hover:border-neutral-400"
            >
              <img src={shot.thumb} alt={shot.alt} loading="lazy" width={shot.width} height={shot.height} className="h-auto w-full" />
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
          onClick={() => setOpen(null)}
        >
          <img
            src={shots[open].full}
            alt={shots[open].alt}
            className="max-h-full max-w-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button type="button" aria-label="Закрыть" onClick={() => setOpen(null)} className="absolute right-4 top-4 text-3xl text-white">×</button>
          {count > 1 && (
            <>
              <button type="button" aria-label="Предыдущий" className={`${navButton} left-4`}
                onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + count) % count); }}>‹</button>
              <button type="button" aria-label="Следующий" className={`${navButton} right-4`}
                onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % count); }}>›</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
