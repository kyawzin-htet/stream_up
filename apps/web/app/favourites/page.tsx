import { redirect } from 'next/navigation';
import { apiFetch } from '../../lib/api';
import { getAccessToken, getCurrentUser } from '../../lib/auth';
import type { Paginated, Video } from '../../lib/types';
import { FavouriteVideoGrid } from '../../components/FavouriteVideoGrid';

export default async function FavouritesPage() {
  const [user, token] = await Promise.all([getCurrentUser(), getAccessToken()]);
  if (!user || !token) redirect('/login');

  const isAdmin = Boolean(user.isAdmin);
  const hasPremium =
    user.membershipType === 'PREMIUM' &&
    (!user.membershipExpiresAt || new Date(user.membershipExpiresAt).getTime() > Date.now());

  if (!isAdmin && !hasPremium) {
    redirect('/account');
  }

  const initial = await apiFetch<Paginated<Video>>('/videos/favorites?page=1&pageSize=10', {}, token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Favourite videos</h1>
        <p className="mt-2 text-sm text-slate-400">Your saved premium picks.</p>
      </div>
      <FavouriteVideoGrid initial={initial} showDateTime={isAdmin} />
    </div>
  );
}
