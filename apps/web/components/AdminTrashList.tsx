'use client';

import { useEffect, useRef, useState } from 'react';
import type { Paginated, Video } from '../lib/types';
import { Toast } from './Toast';
import { VideoPreviewCard } from './VideoPreviewCard';

export function AdminTrashList({
  initial,
  initialQuery = '',
}: {
  initial: Paginated<Video>;
  initialQuery?: string;
}) {
  const [items, setItems] = useState<Video[]>(initial.items);
  const [query, setQuery] = useState(initialQuery);
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [page, setPage] = useState(initial.page);
  const [totalPages, setTotalPages] = useState(initial.totalPages);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function loadPage(nextPage: number, nextQuery: string, replace = false) {
    if (loading) return;
    setLoading(true);
    const params = new URLSearchParams({
      status: 'trashed',
      query: nextQuery,
      page: String(nextPage),
      pageSize: '20',
    });
    const res = await fetch(`/api/admin/videos?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) {
      const message = await res.text();
      setToastMessage(message || 'Failed to load trash');
      setLoading(false);
      return;
    }

    const data = (await res.json()) as Paginated<Video>;
    setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
    setPage(data.page);
    setTotalPages(data.totalPages);
    setLoading(false);
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    setAppliedQuery(nextQuery);
    await loadPage(1, nextQuery, true);
  }

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (loading || page >= totalPages) return;
        void loadPage(page + 1, appliedQuery);
      },
      { rootMargin: '200px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, page, totalPages, appliedQuery]);

  async function handleRestore(id: string) {
    if (busyId) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/videos/${id}/restore`, { method: 'PATCH' });
    if (!res.ok) {
      const message = await res.text();
      setToastMessage(message || 'Failed to restore video');
      setBusyId(null);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    setToastMessage('Video restored');
    setBusyId(null);
  }

  async function handleDelete(id: string) {
    if (busyId) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const message = await res.text();
      setToastMessage(message || 'Failed to delete video');
      setBusyId(null);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    setToastMessage('Video deleted permanently');
    setBusyId(null);
    setConfirmId(null);
  }

  const visibleItems = items;

  return (
    <div>
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Trash</h2>
        <span className="text-xs text-slate-500">{visibleItems.length} items</span>
      </div>

      <form onSubmit={handleSearch} className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search trashed videos"
          className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          Search
        </button>
      </form>

      {visibleItems.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6 text-sm text-slate-400">
          Trash is empty.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleItems.map((video) => (
            <div key={video.id} className="relative">
              <VideoPreviewCard
                video={video}
                showDateTime={false}
                locked={false}
                linkable={false}
                showBadge={false}
                className="w-full"
              />
              <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleRestore(video.id);
                  }}
                  disabled={busyId === video.id}
                  className="rounded-full border border-emerald-400/40 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-emerald-300 hover:border-emerald-300 hover:text-emerald-200 disabled:opacity-60"
                >
                  {busyId === video.id ? 'Working…' : 'Restore'}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setConfirmId(video.id);
                  }}
                  disabled={busyId === video.id}
                  className="rounded-full border border-red-400/40 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-red-300 hover:border-red-300 hover:text-red-200 disabled:opacity-60"
                >
                  {busyId === video.id ? 'Working…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col items-center gap-2 text-xs text-slate-500">
        {loading && <span>Loading more…</span>}
        {page >= totalPages && visibleItems.length > 0 && <span>End of results</span>}
      </div>
      <div ref={sentinelRef} aria-hidden="true" />

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800/80 bg-slate-900/90 p-6 text-slate-100 shadow-xl">
            <h3 className="text-lg font-semibold">Delete permanently?</h3>
            <p className="mt-2 text-sm text-slate-400">
              This will permanently delete the video and remove it from Telegram storage. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmId)}
                disabled={busyId === confirmId}
                className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {busyId === confirmId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
