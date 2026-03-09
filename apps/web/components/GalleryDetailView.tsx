import Link from 'next/link';
import type { GalleryImageGroup } from '../lib/types';
import { GalleryLikeButton } from './GalleryLikeButton';
import { GalleryDetailImageList } from './GalleryDetailImageList';

export function GalleryDetailView({
  group,
  backHref,
  isAuthenticated,
  locked,
}: {
  group: GalleryImageGroup;
  backHref: string;
  isAuthenticated: boolean;
  locked: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Link href={backHref} className="text-slate-300 transition hover:text-white">
          Gallary
        </Link>
        <span>/</span>
        <span>{group.title}</span>
      </div>

      <h1 className="text-3xl font-semibold text-slate-100">{group.title}</h1>

      {locked ? (
        <section className="rounded-lg border border-[#2f2f2f] bg-[#181818] p-6">
          <div className="relative overflow-hidden rounded-lg bg-[#202020]">
            {group.coverImage ? (
              <img
                src={`/api/gallery-images/${group.coverImage.id}/file`}
                alt={group.title}
                className="h-[420px] w-full scale-105 object-cover blur-md"
              />
            ) : (
              <div className="flex h-[420px] items-center justify-center text-sm text-slate-500">No preview</div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 px-8 text-center text-sm font-semibold uppercase tracking-[0.24em] text-white">
              Premium membership required to view this image group
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-end">
            <GalleryLikeButton
              groupId={group.id}
              initialCount={group.likeCount}
              initialLiked={group.likedByMe}
              isAuthenticated={isAuthenticated}
            />
          </div>

          <GalleryDetailImageList title={group.title} images={group.images} />
        </section>
      )}
    </div>
  );
}
