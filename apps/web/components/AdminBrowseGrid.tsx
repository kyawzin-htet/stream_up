'use client';

import { useEffect, useRef, useState } from 'react';
import type { Paginated, Video } from '../lib/types';
import { VideoPreviewCard } from './VideoPreviewCard';
import { Toast } from './Toast';

export function AdminBrowseGrid({ initial }: { initial: Paginated<Video> }) {
  const [items, setItems] = useState<Video[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [tab, setTab] = useState<'ALL' | 'FREE' | 'PREMIUM'>('ALL');
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(initial.items);
    setPage(initial.page);
    setTotalPages(initial.totalPages);
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
  }, [loading, page, totalPages, tab]);

  function buildQuery(nextPage: number, nextTab = tab) {
    const params = new URLSearchParams({
      status: 'active',
      page: String(nextPage),
      pageSize: '20',
    });
    if (nextTab === 'FREE') params.set('premium', 'false');
    if (nextTab === 'PREMIUM') params.set('premium', 'true');
    return params;
  }

  async function loadMore() {
    if (loading || page >= totalPages) return;
    setLoading(true);
    const nextPage = page + 1;
    const res = await fetch(`/api/admin/videos?${buildQuery(nextPage).toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const message = await res.text();
      setToastMessage(message || 'Failed to load videos');
      setLoading(false);
      return;
    }

    const data = (await res.json()) as Paginated<Video>;
    setItems((prev) => [...prev, ...data.items]);
    setPage(data.page);
    setTotalPages(data.totalPages);
    setLoading(false);
  }

  async function switchTab(nextTab: 'ALL' | 'FREE' | 'PREMIUM') {
    if (loading) return;
    setTab(nextTab);
    setLoading(true);
    const res = await fetch(`/api/admin/videos?${buildQuery(1, nextTab).toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const message = await res.text();
      setToastMessage(message || 'Failed to load videos');
      setLoading(false);
      return;
    }

    const data = (await res.json()) as Paginated<Video>;
    setItems(data.items);
    setPage(data.page);
    setTotalPages(data.totalPages);
    setLoading(false);
  }

  async function handleTrash(id: string) {
    if (busyId) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/videos/${id}/trash`, { method: 'PATCH' });
    if (!res.ok) {
      const message = await res.text();
      setToastMessage(message || 'Failed to move video to Trash');
      setBusyId(null);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    setToastMessage('Video moved to Trash');
    setBusyId(null);
    setConfirmId(null);
  }

  const visibleItems = items;

  return (
    <div className="space-y-4">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'FREE', 'PREMIUM'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => switchTab(value)}
            className={tab === value ? 'tab-pill tab-pill-active' : 'tab-pill'}
          >
            {value === 'ALL' ? 'All' : value === 'FREE' ? 'Free' : 'Premium'}
          </button>
        ))}
      </div>

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
              showDateTime={false}
              locked={false}
              showBadge={false}
              className="w-full"
              topLeftSlot={
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setConfirmId(video.id);
                  }}
                  disabled={busyId === video.id}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-400/50 bg-slate-950/80 text-red-300 hover:border-red-300 hover:text-red-200 disabled:opacity-60"
                  title="Move to Trash"
                  aria-label="Move to Trash"
                >
                  {busyId === video.id ? (
                    <span className="text-xs">…</span>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M6 6l1 14h10l1-14" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  )}
                </button>
              }
            />
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-2 py-2 text-xs text-slate-500">
        {loading && <span>Loading more…</span>}
        {page >= totalPages && visibleItems.length > 0 && <span>End of results</span>}
      </div>
      <div ref={sentinelRef} aria-hidden="true" />

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#2f2f2f] bg-[#202020] p-6 text-slate-100 shadow-xl">
            <h3 className="text-lg font-semibold">Move to Trash?</h3>
            <p className="mt-2 text-sm text-slate-400">
              This will remove the video from the library. You can restore it from Trash later.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="rounded-full border border-[#2f2f2f] px-4 py-2 text-xs font-semibold text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleTrash(confirmId)}
                disabled={busyId === confirmId}
                className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {busyId === confirmId ? 'Moving…' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
