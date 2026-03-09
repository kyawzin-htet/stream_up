import { apiFetch } from '../../lib/api';
import { getCurrentUser, getAccessToken } from '../../lib/auth';
import type { GalleryImageGroup, Paginated } from '../../lib/types';
import { GalleryImageGrid } from '../../components/GalleryImageGrid';

export default async function GallaryPage({
  searchParams,
}: {
  searchParams?: { query?: string };
}) {
  const [user, token] = await Promise.all([getCurrentUser(), getAccessToken()]);
  const query = (searchParams?.query || '').trim();
  const isAdmin = Boolean(user?.isAdmin);
  const hasPremium =
    user?.membershipType === 'PREMIUM' &&
    (!user.membershipExpiresAt || new Date(user.membershipExpiresAt).getTime() > Date.now());
  const canAccessPremium = isAdmin || hasPremium;

  const params = new URLSearchParams({
    page: '1',
    pageSize: '24',
  });
  if (query) params.set('query', query);

  const initial = await apiFetch<Paginated<GalleryImageGroup>>(`/gallery-images?${params.toString()}`, {}, token);

  return (
    <div className="space-y-6">
      <GalleryImageGrid
        initial={initial}
        canAccessPremium={canAccessPremium}
        isAuthenticated={Boolean(user)}
        query={query}
      />
    </div>
  );
}
