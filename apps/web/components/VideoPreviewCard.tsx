'use client';

import Link from 'next/link';
import { useRef, useState, type ReactNode } from 'react';
import type { Video } from '../lib/types';

function formatDuration(seconds: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return '--:--';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function VideoPreviewCard({
  video,
  showDateTime = false,
  locked = false,
  linkable = true,
  showBadge = true,
  topLeftSlot,
  className,
}: {
  video: Video;
  showDateTime?: boolean;
  locked?: boolean;
  linkable?: boolean;
  showBadge?: boolean;
  topLeftSlot?: ReactNode;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const handlePlay = () => {
    const el = videoRef.current;
    if (!el || hasError) return;
    el.currentTime = 0;
    const playPromise = el.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }
  };

  const handleStop = () => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  };

  const Container = locked || !linkable ? 'div' : Link;

  return (
    <Container
      {...(!locked && linkable ? { href: `/videos/${video.id}` } : {})}
      className={`group aspect-[3/4] w-full overflow-hidden rounded-2xl border border-slate-200/40 bg-transparent p-0 transition dark:border-slate-800/80 ${locked ? 'cursor-not-allowed opacity-90' : 'hover:-translate-y-0.5 hover:shadow-lg'} ${className ?? ''}`}
      onMouseEnter={handlePlay}
      onMouseLeave={handleStop}
      aria-disabled={locked || undefined}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_rgba(255,255,255,0))] opacity-70 dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.4),_rgba(15,23,42,0))]" />
        <video
          ref={videoRef}
          className={`h-full w-full object-cover transition duration-300 ${hasError ? 'opacity-0' : 'opacity-100'} group-hover:scale-[1.02]`}
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(event) => {
            const target = event.currentTarget;
            if (target.duration && Number.isFinite(target.duration)) {
              setDuration(target.duration);
            }
          }}
          onError={() => setHasError(true)}
          src={`/api/videos/${video.id}/preview`}
        />
        <div className="absolute inset-0 bg-slate-950/0 transition group-hover:bg-slate-950/30" />
        <div className="absolute inset-0 ring-1 ring-white/0 transition group-hover:ring-white/40" />
        {(topLeftSlot || showBadge) && (
          <div className="absolute left-3 top-3 z-0">
            {topLeftSlot ? (
              topLeftSlot
            ) : (
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border ${
                  video.isPremium
                    ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                    : 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                }`}
                aria-label={video.isPremium ? 'Premium' : 'Free'}
                title={video.isPremium ? 'Premium' : 'Free'}
              >
                {video.isPremium ? (
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
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
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
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M7 11V8a5 5 0 0 1 9.5-2" />
                  </svg>
                )}
              </span>
            )}
          </div>
        )}
        <div className="absolute right-3 top-3 z-0 rounded-full bg-slate-950/60 px-3 py-1 text-xs text-white">
          {formatDuration(duration)}
        </div>
          {locked && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              Premium only
            </div>
          )}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-200">
              Preview unavailable
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent px-4 pb-4 pt-10">
            <h3 className="text-sm font-semibold text-white">{video.title}</h3>
          </div>
        </div>
    </Container>
  );
}
