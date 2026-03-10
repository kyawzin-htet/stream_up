'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { GalleryImageGroup, Paginated } from '../lib/types';
import { GalleryLikeButton } from './GalleryLikeButton';

export function GalleryImageGrid({
  initial,
  canAccessPremium,
  isAuthenticated,
  query,
  detailBasePath = '/gallary',
  selectableIds,
  onToggleSelect,
  onDeleteGroup,
  deletingIds,
}: {
  initial: Paginated<GalleryImageGroup>;
  canAccessPremium: boolean;
  isAuthenticated: boolean;
  query: string;
  detailBasePath?: string;
  selectableIds?: Set<string>;
  onToggleSelect?: (groupId: string, checked: boolean) => void;
  onDeleteGroup?: (groupId: string) => void;
  deletingIds?: Set<string>;
}) {
  const [items, setItems] = useState<GalleryImageGroup[]>(initial.items);
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
  }, [initial.items, initial.page, initial.totalPages, query]);

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
  }, [loading, page, totalPages, query]);

  async function loadMore() {
    if (loading || page >= totalPages) return;
    setLoading(true);
    setError(null);

    const nextPage = page + 1;
    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: '24',
    });
    if (query) params.set('query', query);

    const res = await fetch(`/api/gallery-images?${params.toString()}`);
    if (!res.ok) {
      const message = await res.text();
      setError(message || 'Failed to load gallery');
      setLoading(false);
      return;
    }

    const data = (await res.json()) as Paginated<GalleryImageGroup>;
    setItems((prev) => [...prev, ...data.items]);
    setPage(data.page);
    setTotalPages(data.totalPages);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#2f2f2f] bg-[#202020] p-6 text-sm text-slate-400">
          No image groups found.
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5">
          {items.map((group) => {
            const locked = group.isPremium && !canAccessPremium;
            const isSelected = selectableIds?.has(group.id) || false;
            const isDeleting = deletingIds?.has(group.id) || false;
            const detailHref = `${detailBasePath}/${group.id}`;
            return (
              <article
                key={group.id}
                className="relative mb-4 inline-block w-full overflow-hidden rounded-lg border border-[#2f2f2f] bg-[#181818] shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
              >
                <Link href={detailHref} className="block">
                  <div className="relative overflow-hidden bg-[#202020]">
                    {group.coverImage ? (
                      <img
                        src={`/api/gallery-images/${group.coverImage.id}/file`}
                        alt={group.title}
                        loading="lazy"
                        className={`block h-auto w-full transition duration-300 ${locked ? 'scale-105 blur-md' : 'hover:scale-[1.03]'}`}
                      />
                    ) : (
                      <div className="flex min-h-40 items-center justify-center text-sm text-slate-500">
                        No preview
                      </div>
                    )}
                    {locked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 px-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white">
                        Premium only
                      </div>
                    )}
                  </div>
                </Link>

                <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                      {group.imageCount}
                    </span>
                    {group.isPremium && (
                      <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                        Premium
                      </span>
                    )}
                  </div>

                  <div className="pointer-events-auto flex shrink-0 items-start gap-2">
                    <GalleryLikeButton
                      groupId={group.id}
                      initialCount={group.likeCount}
                      initialLiked={group.likedByMe}
                      isAuthenticated={isAuthenticated}
                    />
                    {(onDeleteGroup || onToggleSelect) && (
                      <div className="flex flex-col items-center gap-2">
                        {onDeleteGroup && (
                          <button
                            type="button"
                            onClick={() => onDeleteGroup(group.id)}
                            disabled={isDeleting}
                            aria-label="Delete image group"
                            title="Delete image group"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-400/40 bg-rose-500/10 text-rose-200 disabled:opacity-60"
                          >
                            <span aria-hidden="true" className="text-base leading-none">
                              {isDeleting ? '…' : '🗑'}
                            </span>
                          </button>
                        )}
                        {onToggleSelect && (
                          <label
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white"
                            onClick={(event) => event.preventDefault()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(event) => onToggleSelect(group.id, event.target.checked)}
                              onClick={(event) => event.stopPropagation()}
                              className="h-3.5 w-3.5 rounded border-white/40 bg-transparent"
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
