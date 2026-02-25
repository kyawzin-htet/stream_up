import type { Metadata } from 'next';
import { apiFetch } from '../../../lib/api';
import type { Comment, Paginated, Video } from '../../../lib/types';
import { VideoPlayer } from '../../../components/VideoPlayer';
import { getCurrentUser } from '../../../lib/auth';
import { VideoPreviewCard } from '../../../components/VideoPreviewCard';
import { CommentsSection } from '../../../components/CommentsSection';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const video = await apiFetch<Video>(`/videos/${params.id}`);
  return {
    title: `${video.title} — StreamUp`,
    description: video.description,
  };
}

export default async function VideoDetailPage({ params }: { params: { id: string } }) {
  const video = await apiFetch<Video>(`/videos/${params.id}`);
  const user = await getCurrentUser();
  const isAdmin = Boolean(user?.isAdmin);
  const hasPremium =
    user?.membershipType === 'PREMIUM' &&
    (!user.membershipExpiresAt || new Date(user.membershipExpiresAt).getTime() > Date.now());
  const premiumRequired = video.isPremium && !hasPremium;
  const canAccessPremium = isAdmin || hasPremium;

  const categorySlug = video.category?.slug || '';
  const keyword = video.keywords?.[0] || '';

  const [relatedByCategory, relatedByKeyword, comments] = await Promise.all([
    categorySlug
      ? apiFetch<Paginated<Video>>(
          `/videos?category=${encodeURIComponent(categorySlug)}&page=1&pageSize=10`,
        )
      : Promise.resolve({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 }),
    keyword
      ? apiFetch<Paginated<Video>>(
          `/videos?query=${encodeURIComponent(keyword)}&page=1&pageSize=10`,
        )
      : Promise.resolve({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 }),
    apiFetch<Comment[]>(`/videos/${params.id}/comments`),
  ]);

  const categoryItems = relatedByCategory.items.filter((item) => item.id !== video.id);
  const categoryIds = new Set(categoryItems.map((item) => item.id));
  const keywordItems = relatedByKeyword.items.filter(
    (item) => item.id !== video.id && !categoryIds.has(item.id),
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <VideoPlayer videoId={video.id} />
          {isAdmin ? (
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6">
              <h1 className="text-2xl font-semibold text-slate-100">{video.title}</h1>
              <p className="mt-3 text-sm text-slate-400">{video.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                <span className="badge">{video.isPremium ? 'Premium' : 'Free'}</span>
                <span className="text-slate-500">Category: {video.category?.name}</span>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-semibold text-slate-100">{video.title}</h1>
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
          {categoryItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-100">
                Related in {video.category?.name || 'this category'}
              </h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
                {categoryItems.map((item) => (
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

          {keyword && keywordItems.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-100">Related: {keyword}</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
                {keywordItems.map((item) => (
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
