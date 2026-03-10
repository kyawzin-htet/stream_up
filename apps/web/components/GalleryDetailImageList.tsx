'use client';

import { useState } from 'react';
import type { GalleryImageAsset } from '../lib/types';

export function GalleryDetailImageList({
  title,
  images,
}: {
  title: string;
  images: GalleryImageAsset[];
}) {
  const [sizes, setSizes] = useState<Record<string, { width: number; height: number }>>({});

  function handleLoad(imageId: string, event: React.SyntheticEvent<HTMLImageElement>) {
    const target = event.currentTarget;
    const width = Math.max(1, Math.round(target.naturalWidth / 4));
    const height = Math.max(1, Math.round(target.naturalHeight / 4));

    setSizes((prev) => {
      const current = prev[imageId];
      if (current?.width === width && current?.height === height) return prev;
      return {
        ...prev,
        [imageId]: { width, height },
      };
    });
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      {images.map((image, index) => {
        const size = sizes[image.id];
        return (
          <article
            key={image.id}
            className="overflow-hidden rounded-lg border border-[#2f2f2f] bg-[#181818] max-w-full"
            style={size ? { width: `${size.width}px` } : undefined}
          >
            <img
              src={`/api/gallery-images/${image.id}/file`}
              alt={`${title} ${index + 1}`}
              loading="lazy"
              onLoad={(event) => handleLoad(image.id, event)}
              className="block h-auto max-w-full object-contain"
            />
          </article>
        );
      })}
    </div>
  );
}
