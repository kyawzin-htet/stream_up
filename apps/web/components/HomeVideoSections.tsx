'use client';

import { useEffect, useRef, useState } from 'react';
import type { Paginated, Video } from '../lib/types';
import { VideoPreviewCard } from './VideoPreviewCard';

type HomeSort = 'latest' | 'popular';

type FeedState = {
  items: Video[];
  page: number;
  totalPages: number;
  error: string | null;
  initialized: boolean;
};

export function HomeVideoSections({
  initial,
  canAccessPremium,
  showDateTime,
}: {
  initial: Paginated<Video>;
  canAccessPremium: boolean;
  showDateTime: boolean;
}) {
  const [activeSort, setActiveSort] = useState<HomeSort>('latest');
  const [feeds, setFeeds] = useState<Record<HomeSort, FeedState>>({
    latest: {
      items: initial.items,
      page: initial.page,
      totalPages: initial.totalPages,
      error: null,
      initialized: true,
    },
    popular: {
      items: [],
      page: 0,
      totalPages: 1,
      error: null,
      initialized: false,
    },
  });
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setFeeds((prev) => ({
      ...prev,
      latest: {
        items: initial.items,
        page: initial.page,
        totalPages: initial.totalPages,
        error: null,
        initialized: true,
      },
    }));
  }, [initial.items, initial.page, initial.totalPages]);

  useEffect(() => {
    const activeFeed = feeds[activeSort];
    if (activeFeed.initialized || loading) return;
    void fetchPage(activeSort, 1, true);
  }, [activeSort, feeds, loading]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;
    const activeFeed = feeds[activeSort];

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (loading || activeFeed.page >= activeFeed.totalPages) return;
        void loadMore();
      },
      { rootMargin: '200px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [activeSort, feeds, loading]);

  async function fetchPage(sort: HomeSort, pageToLoad: number, replace: boolean) {
    setLoading(true);
    setFeeds((prev) => ({
      ...prev,
      [sort]: {
        ...prev[sort],
        error: null,
      },
    }));

    const params = new URLSearchParams({
      sort,
      page: String(pageToLoad),
      pageSize: '10',
    });

    const res = await fetch(`/api/videos?${params.toString()}`);
    if (!res.ok) {
      const message = await res.text();
      setFeeds((prev) => ({
        ...prev,
        [sort]: {
          ...prev[sort],
          error: message || 'Failed to load videos',
          initialized: true,
        },
      }));
      setLoading(false);
      return;
    }

    const data = (await res.json()) as Paginated<Video>;
    setFeeds((prev) => ({
      ...prev,
      [sort]: {
        items: replace ? data.items : [...prev[sort].items, ...data.items],
        page: data.page,
        totalPages: data.totalPages,
        error: null,
        initialized: true,
      },
    }));
    setLoading(false);
  }

  async function loadMore() {
    const activeFeed = feeds[activeSort];
    if (loading || activeFeed.page >= activeFeed.totalPages) return;
    await fetchPage(activeSort, activeFeed.page + 1, false);
  }

  const activeFeed = feeds[activeSort];
  const visibleItems = activeFeed.items;

  return (
    <div className="space-y-4">
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSort('latest')}
            className={activeSort === 'latest' ? 'tab-pill tab-pill-active' : 'tab-pill'}
          >
            Latest
          </button>
          <button
            type="button"
            onClick={() => setActiveSort('popular')}
            className={activeSort === 'popular' ? 'tab-pill tab-pill-active' : 'tab-pill'}
          >
            Popular
          </button>
        </div>

        {visibleItems.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 text-sm text-slate-400">
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
      </section>

      <div className="flex flex-col items-center gap-2 py-2 text-xs text-slate-500">
        {loading && <span>Loading more…</span>}
        {activeFeed.error && <span className="text-red-400">{activeFeed.error}</span>}
        {activeFeed.page >= activeFeed.totalPages && visibleItems.length > 0 && <span>End of results</span>}
      </div>

      <div ref={sentinelRef} aria-hidden="true" />
    </div>
  );
}
