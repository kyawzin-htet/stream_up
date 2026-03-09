'use client';

import { useEffect, useState } from 'react';

export function VideoFavoriteButton({
  videoId,
  initialFavorited,
  isAuthenticated,
  canFavorite,
}: {
  videoId: string;
  initialFavorited: boolean;
  isAuthenticated: boolean;
  canFavorite: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function syncState() {
      if (!isAuthenticated || !canFavorite) {
        if (active) setFavorited(false);
        return;
      }
      const res = await fetch(`/api/videos/${videoId}/favorite`, { cache: 'no-store' });
      if (!res.ok) return;
      const payload = (await res.json()) as { favorited: boolean };
      if (active) setFavorited(Boolean(payload.favorited));
    }

    void syncState();
    return () => {
      active = false;
    };
  }, [videoId, isAuthenticated, canFavorite]);

  async function handleToggle() {
    if (busy) return;
    if (!isAuthenticated) {
      setStatus('Sign in to add favourites');
      return;
    }
    if (!canFavorite) {
      setStatus('Premium membership required');
      return;
    }

    setBusy(true);
    setStatus(null);
    const res = await fetch(`/api/videos/${videoId}/favorite`, { method: 'POST' });
    if (!res.ok) {
      const message = await res.text();
      setStatus(message || 'Failed to update favourite');
      setBusy(false);
      return;
    }

    const payload = (await res.json()) as { favorited: boolean; favoriteCount: number };
    setFavorited(Boolean(payload.favorited));
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
          favorited
            ? 'border-emerald-300/60 bg-emerald-400/15 text-emerald-200'
            : 'border-[#2f2f2f] bg-[#202020] text-slate-200'
        } disabled:opacity-60`}
      >
        <span aria-hidden="true">{favorited ? '★' : '☆'}</span>
      </button>
      {status && <p className="text-xs text-slate-400">{status}</p>}
    </div>
  );
}
