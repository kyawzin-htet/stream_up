import { apiFetch } from '../../lib/api';
import { getCurrentUser, getAccessToken } from '../../lib/auth';
import type { GalleryImage, Paginated } from '../../lib/types';
import { GalleryImageGrid } from '../../components/GalleryImageGrid';

export default async function GallaryPage() {
  const [user, token] = await Promise.all([getCurrentUser(), getAccessToken()]);
  const isAdmin = Boolean(user?.isAdmin);
  const hasPremium =
    user?.membershipType === 'PREMIUM' &&
    (!user.membershipExpiresAt || new Date(user.membershipExpiresAt).getTime() > Date.now());
  const canAccessPremium = isAdmin || hasPremium;

  const initial = await apiFetch<Paginated<GalleryImage>>('/gallery-images?page=1&pageSize=24', {}, token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Gallary</h1>
        <p className="mt-2 text-sm text-slate-400">Free images are visible to everyone. Premium images are blurred for free and guest users.</p>
      </div>
      <GalleryImageGrid initial={initial} canAccessPremium={canAccessPremium} />
    </div>
  );
}
