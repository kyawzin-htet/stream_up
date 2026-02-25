'use client';

import { useState } from 'react';

export function VideoPlayer({
  videoId,
  className,
}: {
  videoId: string;
  className?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPortrait, setIsPortrait] = useState<boolean | null>(null);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-black h-[360px] sm:h-[420px] ${className ?? ''}`}
    >
      {error && (
        <div className="bg-red-600 p-3 text-sm text-white">{error}</div>
      )}
      {loading && !error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/50 text-sm text-slate-200">
          Loading video...
        </div>
      )}
      <video
        controls
        className={`h-full w-full ${isPortrait ? 'object-cover' : 'object-contain'}`}
        preload="auto"
        onLoadStart={() => setLoading(true)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onPlaying={() => setLoading(false)}
        onLoadedMetadata={(event) => {
          const target = event.currentTarget;
          if (target.videoWidth && target.videoHeight) {
            setIsPortrait(target.videoHeight > target.videoWidth);
          }
        }}
        onError={() => setError('Unable to play this video. Check your access or try again.')}
        src={`/api/videos/${videoId}/stream`}
      />
    </div>
  );
}
