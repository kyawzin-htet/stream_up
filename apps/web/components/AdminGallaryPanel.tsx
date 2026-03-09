'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GalleryImageGroup, Paginated } from '../lib/types';
import { GalleryImageGrid } from './GalleryImageGrid';
import { AdminGalleryUploadForm } from './AdminGalleryUploadForm';

export function AdminGallaryPanel({
  initial,
  query,
}: {
  initial: Paginated<GalleryImageGroup>;
  query: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [busyBulkDelete, setBusyBulkDelete] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<
    | {
        mode: 'single';
        groupId: string;
      }
    | {
        mode: 'bulk';
        ids: string[];
      }
    | null
  >(null);

  function toggleSelect(groupId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(groupId);
      else next.delete(groupId);
      return next;
    });
  }

  async function deleteOne(groupId: string) {
    if (deletingIds.has(groupId)) return;

    setDeletingIds((prev) => new Set(prev).add(groupId));
    setStatus(null);

    const res = await fetch(`/api/admin/gallery-images/${groupId}`, { method: 'DELETE' });
    if (!res.ok) {
      const message = await res.text();
      setStatus(message || 'Failed to delete image group');
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
    setConfirmState(null);
    router.refresh();
  }

  async function bulkDelete() {
    if (busyBulkDelete || selectedIds.size === 0) return;
    const ids = confirmState?.mode === 'bulk' ? confirmState.ids : Array.from(selectedIds);

    setBusyBulkDelete(true);
    setStatus(null);

    const res = await fetch('/api/admin/gallery-images', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) {
      const message = await res.text();
      setStatus(message || 'Failed to delete selected image groups');
      setBusyBulkDelete(false);
      return;
    }

    setSelectedIds(new Set());
    setBusyBulkDelete(false);
    setConfirmState(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-100">Gallary</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirmState({ mode: 'bulk', ids: Array.from(selectedIds) })}
            disabled={busyBulkDelete || selectedIds.size === 0}
            className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 disabled:opacity-60"
          >
            {busyBulkDelete
              ? 'Deleting…'
              : selectedIds.size > 0
                ? `Bulk Delete (${selectedIds.size})`
                : 'Bulk Delete'}
          </button>
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-full border border-[#2f2f2f] px-4 py-2 text-xs font-semibold text-slate-200"
            >
              Clear selection
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-900"
          >
            Upload
          </button>
        </div>
      </div>

      {status && <p className="text-sm text-rose-300">{status}</p>}

      <form action="/admin/gallary" className="flex flex-col gap-3 sm:flex-row">
        <input
          name="query"
          defaultValue={query}
          placeholder="Search by title or tag"
          className="w-full rounded-2xl border border-[#2f2f2f] bg-[#181818] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400/60"
        />
        <button className="rounded-full border border-[#2f2f2f] px-5 py-3 text-sm font-semibold text-slate-200">
          Search
        </button>
      </form>

      <GalleryImageGrid
        initial={initial}
        canAccessPremium={true}
        isAuthenticated={true}
        query={query}
        detailBasePath="/admin/gallary"
        selectableIds={selectedIds}
        onToggleSelect={toggleSelect}
        onDeleteGroup={(groupId) => setConfirmState({ mode: 'single', groupId })}
        deletingIds={deletingIds}
      />

      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#2f2f2f] bg-[#202020] p-6 text-slate-100 shadow-xl">
            <h3 className="text-lg font-semibold">
              {confirmState.mode === 'single' ? 'Delete image group?' : 'Delete selected image groups?'}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {confirmState.mode === 'single'
                ? 'This will permanently delete the image group and remove its images from Telegram storage.'
                : `This will permanently delete ${confirmState.ids.length} selected image group${confirmState.ids.length > 1 ? 's' : ''} and remove their images from Telegram storage.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmState(null)}
                className="rounded-full border border-[#2f2f2f] px-4 py-2 text-xs font-semibold text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  confirmState.mode === 'single'
                    ? deleteOne(confirmState.groupId)
                    : bulkDelete()
                }
                disabled={
                  confirmState.mode === 'single'
                    ? deletingIds.has(confirmState.groupId)
                    : busyBulkDelete
                }
                className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {confirmState.mode === 'single'
                  ? deletingIds.has(confirmState.groupId)
                    ? 'Deleting…'
                    : 'Delete'
                  : busyBulkDelete
                    ? 'Deleting…'
                    : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[#2f2f2f] bg-[#181818] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Upload images</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[#2f2f2f] px-3 py-1 text-xs text-slate-300"
              >
                Close
              </button>
            </div>

            <AdminGalleryUploadForm
              onUploaded={() => {
                setOpen(false);
                setStatus(null);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
