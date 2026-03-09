'use client';

import { useEffect, useRef, useState } from 'react';
import type { GalleryImage, Paginated } from '../lib/types';

export function GalleryImageGrid({
  initial,
  canAccessPremium,
}: {
  initial: Paginated<GalleryImage>;
  canAccessPremium: boolean;
}) {
  const [items, setItems] = useState<GalleryImage[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initial.items);
    setPage(initial.page);
    setTotalPages(initial.totalPages);
    setError(null);
  }, [initial.items, initial.page, initial.totalPages]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (loading || page >= totalPages) return;
        void loadMore();
      },
      { rootMargin: '200px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, page, totalPages]);

  async function loadMore() {
    if (loading || page >= totalPages) return;
    setLoading(true);
    setError(null);
    const nextPage = page + 1;
    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: '24',
    });

    const res = await fetch(`/api/gallery-images?${params.toString()}`);
    if (!res.ok) {
      const message = await res.text();
      setError(message || 'Failed to load gallery');
      setLoading(false);
      return;
    }

    const data = (await res.json()) as Paginated<GalleryImage>;
    setItems((prev) => [...prev, ...data.items]);
    setPage(data.page);
    setTotalPages(data.totalPages);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#2f2f2f] bg-[#202020] p-6 text-sm text-slate-400">
          No images yet.
        </div>
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5">
          {items.map((image, index) => {
            const locked = image.isPremium && !canAccessPremium;
            const ratioPattern = ['1 / 1', '4 / 5', '3 / 4', '1 / 1', '5 / 4'];
            const aspectRatio = ratioPattern[index % ratioPattern.length];
            return (
              <article
                key={image.id}
                className="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-[#2f2f2f] bg-[#202020]"
              >
                <img
                  src={`/api/gallery-images/${image.id}/file`}
                  alt="Gallery image"
                  loading="lazy"
                  style={{ aspectRatio }}
                  className={`h-full w-full object-cover transition duration-300 ${locked ? 'scale-105 blur-md' : 'group-hover:scale-[1.03]'}`}
                />
                {image.isPremium && (
                  <div className="absolute left-2 top-2 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                    Premium
                  </div>
                )}
                {locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Premium only
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="flex flex-col items-center gap-2 py-2 text-xs text-slate-500">
        {loading && <span>Loading more…</span>}
        {error && <span className="text-red-400">{error}</span>}
        {page >= totalPages && items.length > 0 && <span>End of results</span>}
      </div>

      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  );
}
