'use client';

import { useState } from 'react';
import type { Paginated, Video } from '../lib/types';
import { Toast } from './Toast';

export function AdminVideoList({ initial }: { initial: Paginated<Video> }) {
  const [items, setItems] = useState<Video[]>(initial.items);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (deletingId) return;
    const ok = window.confirm('Move this video to Trash? You can restore it later.');
    if (!ok) return;

    setDeletingId(id);
    const res = await fetch(`/api/admin/videos/${id}/trash`, { method: 'PATCH' });
    if (!res.ok) {
      const message = await res.text();
      setToastMessage(message || 'Failed to move video to Trash');
      setDeletingId(null);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    setToastMessage('Video moved to Trash');
    setDeletingId(null);
  }

  return (
    <div className="card p-6">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Videos</h2>
        <span className="text-xs text-slate-500">{items.length} items</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-[#2f2f2f]">
        <div className="grid grid-cols-[2fr_1fr_0.6fr_auto] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:bg-[#202020]">
          <div>Title</div>
          <div>Category</div>
          <div>Access</div>
          <div></div>
        </div>
        <div className="divide-y divide-slate-200">
          {items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500">No videos found.</div>
          ) : (
            items.map((video) => (
              <div key={video.id} className="grid grid-cols-[2fr_1fr_0.6fr_auto] gap-4 px-4 py-3 text-sm">
                <div className="font-medium text-slate-700 dark:text-slate-100">{video.title}</div>
                <div className="text-slate-500">{video.category?.name || '—'}</div>
                <div className="text-slate-500">{video.isPremium ? 'Premium' : 'Free'}</div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(video.id)}
                    disabled={deletingId === video.id}
                    className="rounded-full border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-300 hover:border-red-300 hover:text-red-200 disabled:opacity-60"
                  >
                    {deletingId === video.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
