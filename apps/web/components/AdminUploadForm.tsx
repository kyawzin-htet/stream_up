'use client';

import { useState } from 'react';
import type { Category } from '../lib/types';

const MAX_UPLOAD_MB = 500;
const MAX_DURATION_SEC = 15 * 60;

function formatSeconds(seconds: number) {
  if (!Number.isFinite(seconds)) return '--:--';
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function AdminUploadForm({ categories }: { categories: Category[] }) {
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [fileInfo, setFileInfo] = useState<{ sizeMb: number; durationSec: number } | null>(null);
  const [allowTranscode, setAllowTranscode] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState<number | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploading) return;

    const form = event.currentTarget;
    const selectedFile = (form.elements.namedItem('file') as HTMLInputElement | null)?.files?.[0];
    if (!selectedFile) {
      setStatus('Please choose a video file');
      return;
    }

    setIsUploading(true);
    setUploadPercent(0);
    setStatus('Uploading...');
    const formData = new FormData(form);

    let response: { status: number; body: string };
    try {
      response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/videos');

        xhr.upload.onprogress = (progressEvent) => {
          if (!progressEvent.lengthComputable) return;
          const percent = Math.min(100, Math.round((progressEvent.loaded / progressEvent.total) * 100));
          setUploadPercent(percent);
          setStatus(percent >= 100 ? 'Upload sent. Processing video...' : `Uploading... ${percent}%`);
        };

        xhr.onload = () => {
          resolve({
            status: xhr.status,
            body: xhr.responseText || '',
          });
        };

        xhr.onerror = () => reject(new Error('Network error while uploading'));
        xhr.send(formData);
      });
    } catch (error: any) {
      setStatus(error?.message || 'Upload failed');
      setIsUploading(false);
      return;
    }

    if (response.status < 200 || response.status >= 300) {
      try {
        const parsed = JSON.parse(response.body) as { message?: string | string[]; error?: string };
        const message = Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
        setStatus(message || parsed.error || 'Upload failed');
      } catch {
        setStatus(response.body || 'Upload failed');
      }
      setIsUploading(false);
      return;
    }

    setStatus('Upload complete');
    setIsUploading(false);
    setUploadPercent(0);
    form.reset();
    setFileInfo(null);
    setAllowTranscode(false);
    setTrimStart(0);
    setTrimEnd(null);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setFileInfo(null);
      return;
    }

    const sizeMb = file.size / (1024 * 1024);
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const durationSec = Number.isFinite(video.duration) ? video.duration : 0;
      setFileInfo({ sizeMb, durationSec });
      setTrimStart(0);
      setTrimEnd(durationSec > MAX_DURATION_SEC ? MAX_DURATION_SEC : Math.floor(durationSec));
    };
    video.src = url;
  }

  const isTooLarge = fileInfo ? fileInfo.sizeMb > MAX_UPLOAD_MB : false;
  const isTooLong = fileInfo ? fileInfo.durationSec > MAX_DURATION_SEC : false;
  const canSubmit = !isUploading && (!isTooLarge || allowTranscode);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase text-slate-500">Title</label>
        <input name="title" required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase text-slate-500">Description</label>
        <textarea
          name="description"
          required
          rows={4}
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase text-slate-500">Category</label>
        <select name="categoryId" required className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase text-slate-500">Keywords (comma-separated)</label>
        <input name="keywords" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
      </div>
      <div className="flex items-center gap-4">
        <label className="text-xs font-semibold uppercase text-slate-500">Premium</label>
        <select name="isPremium" className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
          <option value="false">Free</option>
          <option value="true">Premium</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold uppercase text-slate-500">Video File</label>
        <input
          name="file"
          type="file"
          accept="video/*"
          required
          className="mt-2 w-full"
          onChange={handleFileChange}
        />
        {fileInfo && (
          <div className="mt-2 text-xs text-slate-500">
            Size: {fileInfo.sizeMb.toFixed(1)}MB · Duration: {formatSeconds(fileInfo.durationSec)}
          </div>
        )}
      </div>
      {isTooLong && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs text-amber-200">
          <p className="font-semibold">Duration exceeds 15 minutes.</p>
          <p className="mt-1 text-amber-200/80">We will trim the video. Adjust start/end below.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-semibold uppercase text-amber-200/80">Trim start (seconds)</label>
              <input
                name="trimStart"
                type="number"
                min={0}
                step={1}
                value={trimStart}
                onChange={(event) => setTrimStart(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-amber-400/30 bg-slate-950/40 px-3 py-2 text-xs text-amber-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase text-amber-200/80">Trim end (seconds)</label>
              <input
                name="trimEnd"
                type="number"
                min={1}
                step={1}
                value={trimEnd ?? MAX_DURATION_SEC}
                onChange={(event) => setTrimEnd(Number(event.target.value))}
                className="mt-2 w-full rounded-xl border border-amber-400/30 bg-slate-950/40 px-3 py-2 text-xs text-amber-100"
              />
            </div>
          </div>
        </div>
      )}
      {isTooLarge && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-xs text-red-200">
          <p className="font-semibold">File exceeds {MAX_UPLOAD_MB}MB.</p>
          <p className="mt-1 text-red-200/80">
            Enable quality reduction to continue. This will lower resolution/bitrate to reduce size.
          </p>
          <label className="mt-3 flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              name="allowTranscode"
              value="true"
              checked={allowTranscode}
              onChange={(event) => setAllowTranscode(event.target.checked)}
            />
            Reduce quality to fit size
          </label>
        </div>
      )}
      {isUploading && (
        <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase text-sky-200">
            <span>Upload progress</span>
            <span>{uploadPercent}%</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-900/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-200"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
        </div>
      )}
      <button
        disabled={!canSubmit}
        className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {isUploading ? 'Uploading…' : 'Upload video'}
      </button>
      {status && <p className="text-sm text-slate-600">{status}</p>}
    </form>
  );
}
