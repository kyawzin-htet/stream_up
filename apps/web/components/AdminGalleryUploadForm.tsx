'use client';

import { useState } from 'react';

export function AdminGalleryUploadForm({
  onUploaded,
}: {
  onUploaded?: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploading) return;

    const form = event.currentTarget;
    const filesInput = form.elements.namedItem('files') as HTMLInputElement | null;
    const files = filesInput?.files;
    if (!files || files.length === 0) {
      setStatus('Please choose image files');
      return;
    }

    const isPremium = (form.elements.namedItem('isPremium') as HTMLSelectElement | null)?.value === 'true';
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    setIsUploading(true);
    setStatus('Uploading...');

    const res = await fetch(`/api/admin/gallery-images?isPremium=${isPremium ? 'true' : 'false'}`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const message = await res.text();
      setStatus(message || 'Upload failed');
      setIsUploading(false);
      return;
    }

    const payload = (await res.json()) as { count?: number };
    setStatus(`Upload complete (${payload.count || files.length} image${(payload.count || files.length) > 1 ? 's' : ''})`);
    setIsUploading(false);
    form.reset();
    onUploaded?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase text-slate-500">Access</label>
        <select
          name="isPremium"
          className="w-full rounded-xl border border-[#2f2f2f] bg-[#202020] px-4 py-3 text-sm text-slate-100"
        >
          <option value="false">Free</option>
          <option value="true">Premium</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase text-slate-500">Images (one or multiple)</label>
        <input
          name="files"
          type="file"
          accept="image/*"
          multiple
          className="w-full"
        />
      </div>

      <button
        disabled={isUploading}
        className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isUploading ? 'Uploading…' : 'Upload images'}
      </button>

      {status && <p className="text-sm text-slate-400">{status}</p>}
    </form>
  );
}
