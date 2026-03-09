'use client';

import { useEffect, useRef, useState } from 'react';
import type { Paginated, Video } from '../lib/types';
import { VideoPreviewCard } from './VideoPreviewCard';

export function BrowseVideoGrid({
  initial,
  query,
  category,
  canAccessPremium,
  showDateTime,
}: {
  initial: Paginated<Video>;
  query: string;
  category: string;
  canAccessPremium: boolean;
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
  }, [initial.items, initial.page, initial.totalPages, query, category]);

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
  }, [loading, page, totalPages, query, category]);

  async function loadMore() {
    if (loading || page >= totalPages) return;
    setLoading(true);
    setError(null);
    const nextPage = page + 1;
    const params = new URLSearchParams({
      query,
      category,
      page: String(nextPage),
      pageSize: '10',
    });

    const res = await fetch(`/api/videos?${params.toString()}`);
    if (!res.ok) {
      const message = await res.text();
      setError(message || 'Failed to load more videos');
      setLoading(false);
      return;
    }

    const data = (await res.json()) as Paginated<Video>;
    setItems((prev) => [...prev, ...data.items]);
    setPage(data.page);
    setTotalPages(data.totalPages);
    setLoading(false);
  }

  const visibleItems = items;

  return (
    <div className="space-y-4">
      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-[#2f2f2f] bg-[#202020] p-6 text-sm text-slate-400">
          No videos found.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleItems.map((video) => (
            <VideoPreviewCard
              key={video.id}
              video={video}
              showDateTime={showDateTime}
              locked={video.isPremium && !canAccessPremium}
              className="w-full"
            />
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-2 py-2 text-xs text-slate-500">
        {loading && <span>Loading more…</span>}
        {error && <span className="text-red-400">{error}</span>}
        {page >= totalPages && visibleItems.length > 0 && <span>End of results</span>}
      </div>

      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  );
}
