'use client';

import { useEffect, useRef, useState } from 'react';
import type { Paginated, Video } from '../lib/types';
import { VideoPreviewCard } from './VideoPreviewCard';

export function FavouriteVideoGrid({
  initial,
  showDateTime,
}: {
  initial: Paginated<Video>;
  showDateTime: boolean;
}) {
  const [items, setItems] = useState<Video[]>(initial.items);
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
      pageSize: '10',
    });

    const res = await fetch(`/api/videos/favorites?${params.toString()}`);
    if (!res.ok) {
      const message = await res.text();
      setError(message || 'Failed to load favourites');
      setLoading(false);
      return;
    }

    const data = (await res.json()) as Paginated<Video>;
    setItems((prev) => [...prev, ...data.items]);
    setPage(data.page);
    setTotalPages(data.totalPages);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#2f2f2f] bg-[#202020] p-6 text-sm text-slate-400">
          No favourite videos yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((video) => (
            <VideoPreviewCard
              key={video.id}
              video={video}
              showDateTime={showDateTime}
              className="w-full"
            />
          ))}
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
