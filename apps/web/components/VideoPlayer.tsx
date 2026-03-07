'use client';

import { useState } from 'react';

function getBufferedPercent(video: HTMLVideoElement) {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return 0;
  if (!video.buffered || video.buffered.length === 0) return 0;
  const bufferedEnd = video.buffered.end(video.buffered.length - 1);
  const percent = Math.round((bufferedEnd / video.duration) * 100);
  return Math.max(0, Math.min(100, percent));
}

export function VideoPlayer({
  videoId,
  className,
}: {
  videoId: string;
  className?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [isPortrait, setIsPortrait] = useState<boolean | null>(null);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-black h-[360px] sm:h-[420px] ${className ?? ''}`}
    >
      {error && (
        <div className="bg-red-600 p-3 text-sm text-white">{error}</div>
      )}
      {loading && !error && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-950/50 text-sm text-slate-200">
          Loading video... {loadingPercent}%
        </div>
      )}
      <video
        controls
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        className={`h-full w-full ${isPortrait ? 'object-cover' : 'object-contain'}`}
        preload="auto"
        onContextMenu={(event) => event.preventDefault()}
        onLoadStart={() => {
          setLoading(true);
          setLoadingPercent(0);
        }}
        onProgress={(event) => {
          setLoadingPercent(getBufferedPercent(event.currentTarget));
        }}
        onWaiting={(event) => {
          setLoading(true);
          setLoadingPercent(getBufferedPercent(event.currentTarget));
        }}
        onCanPlay={(event) => {
          setLoadingPercent(100);
          setLoading(false);
        }}
        onCanPlayThrough={(event) => {
          setLoadingPercent(100);
          setLoading(false);
        }}
        onLoadedData={(event) => {
          setLoadingPercent(getBufferedPercent(event.currentTarget));
          setLoading(false);
        }}
        onPlay={() => setLoading(false)}
        onPlaying={() => setLoading(false)}
        onLoadedMetadata={(event) => {
          const target = event.currentTarget;
          if (target.videoWidth && target.videoHeight) {
            setIsPortrait(target.videoHeight > target.videoWidth);
          }
          setLoadingPercent(getBufferedPercent(target));
        }}
        onError={() => setError('Unable to play this video. Check your access or try again.')}
        src={`/api/videos/${videoId}/stream`}
      />
    </div>
  );
}
