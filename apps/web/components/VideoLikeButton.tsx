'use client';

import { useState } from 'react';

export function VideoLikeButton({
  videoId,
  initialCount,
  initialLiked,
  isAuthenticated,
}: {
  videoId: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
}) {
  const [likeCount, setLikeCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleToggle() {
    if (busy) return;
    if (!isAuthenticated) {
      setStatus('Sign in to like videos');
      return;
    }

    setBusy(true);
    setStatus(null);
    const res = await fetch(`/api/videos/${videoId}/like`, { method: 'POST' });
    if (!res.ok) {
      const message = await res.text();
      setStatus(message || 'Failed to update like');
      setBusy(false);
      return;
    }

    const payload = (await res.json()) as { liked: boolean; likeCount: number };
    setLiked(Boolean(payload.liked));
    setLikeCount(Number(payload.likeCount || 0));
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
          liked
            ? 'border-rose-300/60 bg-rose-400/15 text-rose-200'
            : 'border-slate-700 bg-slate-900/60 text-slate-200'
        } disabled:opacity-60`}
      >
        <span aria-hidden="true">{liked ? '♥' : '♡'}</span>
        {/* <span>{liked ? 'Liked' : 'Like'}</span> */}
        <span className="text-slate-300">{likeCount}</span>
      </button>
      {status && <p className="text-xs text-slate-400">{status}</p>}
    </div>
  );
}
