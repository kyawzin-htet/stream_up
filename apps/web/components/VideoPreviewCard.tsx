'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Video } from '../lib/types';
import { formatCompactCount } from '../lib/format';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [gifRetry, setGifRetry] = useState(0);
  const [gifExhausted, setGifExhausted] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [previewMode, setPreviewMode] = useState<'image' | 'video'>('image');
  const allowPreview = true;
  const hasGif = Boolean(video.hasGif);

  useEffect(() => {
    setGifRetry(0);
    setGifExhausted(false);
    setShouldLoad(false);
    setPreviewMode('image');
  }, [video.id, video.hasGif]);

  useEffect(() => {
    if (!allowPreview) return;
    const target = containerRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: '200px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [allowPreview]);

  const cardClassName = `group aspect-[3/4] w-full overflow-hidden rounded-2xl border border-slate-200/40 bg-transparent p-0 transition dark:border-[#2f2f2f] ${locked ? 'cursor-not-allowed opacity-90' : 'hover:-translate-y-0.5 hover:shadow-lg'} ${className ?? ''}`;
  const canLoadGif = true;
  const showGif = hasGif && canLoadGif && shouldLoad && !gifExhausted;
  const showImagePreview = showGif && previewMode === 'image';
  const showVideoPreview = showGif && previewMode === 'video';
  const showFallbackText = hasGif && !locked && shouldLoad && gifExhausted;
  const likeCount = Number(video.likeCount || 0);
  const watchCount = Number(video.watchCount || 0);

  const content = (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_rgba(255,255,255,0))] opacity-70 dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.4),_rgba(15,23,42,0))]" />
      <img
        className={`h-full w-full object-cover transition duration-300 ${showImagePreview ? 'opacity-100' : 'opacity-0'} group-hover:scale-[1.02]`}
        loading="lazy"
        alt={video.title}
        src={showImagePreview ? `/api/videos/${video.id}/gif?r=${gifRetry}` : undefined}
        onLoad={() => setGifExhausted(false)}
        onError={() => {
          setPreviewMode('video');
        }}
      />
      <video
        className={`absolute inset-0 h-full w-full object-cover transition duration-300 ${showVideoPreview ? 'opacity-100' : 'opacity-0'} group-hover:scale-[1.02]`}
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
        src={showVideoPreview ? `/api/videos/${video.id}/gif?r=${gifRetry}` : undefined}
        onLoadedData={() => setGifExhausted(false)}
        onError={() => {
          if (gifRetry < 1) {
            setGifRetry((prev) => prev + 1);
            return;
          }
          setGifExhausted(true);
        }}
      />
      {showFallbackText && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
          Preview unavailable
        </div>
      )}
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
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          Premium only
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent px-4 pb-4 pt-10">
        <h3 className="text-sm font-semibold text-white">{video.title}</h3>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300">
          <span>{showDateTime ? new Date(video.createdAt).toLocaleString() : ''}</span>
          <span className="inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-slate-200">
              <span aria-hidden="true">👁</span>
              <span>{formatCompactCount(watchCount)}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-rose-200">
              <span aria-hidden="true">♥</span>
              <span>{likeCount}</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );

  if (!linkable) {
    return (
      <div className={cardClassName} aria-disabled={locked || undefined}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/videos/${video.id}`}
      prefetch={false}
      className={cardClassName}
      aria-disabled={locked || undefined}
    >
      {content}
    </Link>
  );
}
