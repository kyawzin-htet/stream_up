'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { GalleryImage, Paginated } from '../lib/types';
import { GalleryImageGrid } from './GalleryImageGrid';
import { AdminGalleryUploadForm } from './AdminGalleryUploadForm';

export function AdminGallaryPanel({
  initial,
}: {
  initial: Paginated<GalleryImage>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Gallary</h1>
          <p className="mt-2 text-sm text-slate-400">
            Free images are visible to everyone. Premium images are blurred for free and guest users.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-900"
        >
          Upload images
        </button>
      </div>

      <GalleryImageGrid initial={initial} canAccessPremium={true} />

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
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
