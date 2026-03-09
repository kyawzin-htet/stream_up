'use client';

import { useState } from 'react';

export function GalleryLikeButton({
  groupId,
  initialCount,
  initialLiked,
  isAuthenticated,
}: {
  groupId: string;
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
      setStatus('Sign in to like image groups');
      return;
    }

    setBusy(true);
    setStatus(null);

    const res = await fetch(`/api/gallery-images/${groupId}/like`, { method: 'POST' });
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
            : 'border-[#2f2f2f] bg-[#202020] text-slate-200'
        } disabled:opacity-60`}
      >
        <span aria-hidden="true">{liked ? '♥' : '♡'}</span>
        <span className="text-slate-300">{likeCount}</span>
      </button>
      {status && <p className="text-xs text-slate-400">{status}</p>}
    </div>
  );
}
