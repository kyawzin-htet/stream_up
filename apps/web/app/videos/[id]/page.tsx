import type { Metadata } from 'next';
import { apiFetch } from '../../../lib/api';
import type { Comment, Paginated, Video } from '../../../lib/types';
import { VideoPlayer } from '../../../components/VideoPlayer';
import { getAccessToken, getCurrentUser } from '../../../lib/auth';
import { VideoPreviewCard } from '../../../components/VideoPreviewCard';
import { CommentsSection } from '../../../components/CommentsSection';
import { VideoLikeButton } from '../../../components/VideoLikeButton';
import { VideoFavoriteButton } from '../../../components/VideoFavoriteButton';
import { formatCompactCount } from '../../../lib/format';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const video = await apiFetch<Video>(`/videos/${params.id}`);
  return {
    title: `${video.title} — StreamUp`,
    description: video.description,
  };
}

export default async function VideoDetailPage({ params }: { params: { id: string } }) {
  let watchedCount: number | null = null;
  try {
    const watched = await apiFetch<{ watchCount?: number }>(`/videos/${params.id}/watch`, {
      method: 'POST',
    });
    if (typeof watched.watchCount === 'number') watchedCount = watched.watchCount;
  } catch {
    watchedCount = null;
  }

  const [token, user] = await Promise.all([
    getAccessToken(),
    getCurrentUser(),
  ]);
  const video = await apiFetch<Video>(`/videos/${params.id}`, {}, token);
  const watchCount = watchedCount ?? Number(video.watchCount || 0);
  const isAdmin = Boolean(user?.isAdmin);
  const hasPremium =
    user?.membershipType === 'PREMIUM' &&
    (!user.membershipExpiresAt || new Date(user.membershipExpiresAt).getTime() > Date.now());
  const canAccessPremium = isAdmin || hasPremium;
  const canUseFavorites = isAdmin || hasPremium;

  const categorySlug = video.category?.slug || '';
  const keyword = video.keywords?.[0] || '';

  const [relatedByCategory, relatedByKeyword, fallbackRelated, comments] = await Promise.all([
    categorySlug
      ? apiFetch<Paginated<Video>>(
          `/videos?category=${encodeURIComponent(categorySlug)}&page=1&pageSize=16`,
        )
      : Promise.resolve({ items: [], page: 1, pageSize: 16, total: 0, totalPages: 1 }),
    keyword
      ? apiFetch<Paginated<Video>>(
          `/videos?query=${encodeURIComponent(keyword)}&page=1&pageSize=16`,
        )
      : Promise.resolve({ items: [], page: 1, pageSize: 16, total: 0, totalPages: 1 }),
    apiFetch<Paginated<Video>>('/videos?page=1&pageSize=24'),
    apiFetch<Comment[]>(`/videos/${params.id}/comments`),
  ]);

  const categoryItems = relatedByCategory.items
    .filter((item) => item.id !== video.id)
    .slice(0, 8);
  const seenIds = new Set([video.id, ...categoryItems.map((item) => item.id)]);
  const keywordItems = relatedByKeyword.items
    .filter((item) => !seenIds.has(item.id))
    .slice(0, 8);
  keywordItems.forEach((item) => seenIds.add(item.id));
  const fallbackItems = fallbackRelated.items
    .filter((item) => !seenIds.has(item.id))
    .slice(0, 8);
  const relatedItems = [...categoryItems, ...keywordItems, ...fallbackItems].slice(0, 12);
  const relatedKeywordLabel =
    keywordItems.length > 0 && keyword
      ? ` + ${keywordItems.length} keyword match${keywordItems.length > 1 ? 'es' : ''}`
      : '';
  const relatedTitle = categoryItems.length
    ? `Related in ${video.category?.name || 'this category'}${relatedKeywordLabel}`
    : keywordItems.length > 0
      ? `Related by keyword: ${keyword}`
      : 'Related videos';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <VideoPlayer videoId={video.id} />
          {isAdmin ? (
            <div className="rounded-2xl border border-[#2f2f2f] bg-[#202020] p-6">
              <h1 className="text-2xl font-semibold text-slate-100">{video.title}</h1>
              <p className="mt-3 text-sm text-slate-400">{video.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                <span className="badge">{video.isPremium ? 'Premium' : 'Free'}</span>
                <span className="text-slate-500">Category: {video.category?.name}</span>
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-3">
                <VideoLikeButton
                  videoId={video.id}
                  initialCount={video.likeCount || 0}
                  initialLiked={Boolean(video.likedByMe)}
                  isAuthenticated={Boolean(user)}
                />
                <VideoFavoriteButton
                  videoId={video.id}
                  initialFavorited={Boolean(video.favoritedByMe)}
                  isAuthenticated={Boolean(user)}
                  canFavorite={canUseFavorites}
                />
                <span className="inline-flex items-center gap-2 rounded-full border border-[#2f2f2f] bg-[#202020] px-4 py-2 text-xs font-semibold text-slate-200">
                  <span aria-hidden="true">👁</span>
                  <span>{formatCompactCount(watchCount)}</span>
                </span>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">{video.title}</h1>
              <div className="mt-3 flex flex-wrap items-start gap-3">
                <VideoLikeButton
                  videoId={video.id}
                  initialCount={video.likeCount || 0}
                  initialLiked={Boolean(video.likedByMe)}
                  isAuthenticated={Boolean(user)}
                />
                <VideoFavoriteButton
                  videoId={video.id}
                  initialFavorited={Boolean(video.favoritedByMe)}
                  isAuthenticated={Boolean(user)}
                  canFavorite={canUseFavorites}
                />
                <span className="inline-flex items-center gap-2 rounded-full border border-[#2f2f2f] bg-[#202020] px-4 py-2 text-xs font-semibold text-slate-200">
                  <span aria-hidden="true">👁</span>
                  <span>{formatCompactCount(watchCount)}</span>
                </span>
              </div>
            </div>
          )}
          <CommentsSection
            videoId={video.id}
            initial={comments}
            isAuthenticated={Boolean(user)}
            canPost={Boolean(user && (isAdmin || hasPremium))}
          />
        </div>
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {relatedItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-100">{relatedTitle}</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
                {relatedItems.map((item) => (
                  <VideoPreviewCard
                    key={item.id}
                    video={item}
                    showDateTime={isAdmin}
                    locked={item.isPremium && !canAccessPremium}
                    className="w-full"
                  />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
