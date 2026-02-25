'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Paginated, Video } from '../lib/types';
import { VideoPreviewCard } from './VideoPreviewCard';

export function HomeVideoSections({
  initial,
  canAccessPremium,
  showDateTime,
}: {
  initial: Paginated<Video>;
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

    const res = await fetch(`/api/videos?${params.toString()}`, { cache: 'no-store' });
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

  const premiumItems = items.filter((video) => video.isPremium);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Latest uploads</h2>
          <Link href="/search" className="text-xs font-semibold text-emerald-300">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((video) => (
            <VideoPreviewCard
              key={video.id}
              video={video}
              showDateTime={showDateTime}
              locked={video.isPremium && !canAccessPremium}
              className="w-full"
            />
          ))}
        </div>
      </section>

      {premiumItems.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Premium picks</h2>
            <Link href="/search" className="text-xs font-semibold text-emerald-300">
              Explore premium
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {premiumItems.map((video) => (
              <VideoPreviewCard
                key={video.id}
                video={video}
                showDateTime={showDateTime}
                locked={video.isPremium && !canAccessPremium}
                className="w-full"
              />
            ))}
          </div>
        </section>
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
