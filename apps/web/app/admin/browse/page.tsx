import { redirect } from 'next/navigation';
import { getAccessToken, getCurrentUser } from '../../../lib/auth';
import { apiFetch } from '../../../lib/api';
import type { Paginated, Video } from '../../../lib/types';
import { AdminBrowseGrid } from '../../../components/AdminBrowseGrid';

export default async function AdminBrowsePage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/login');

  const token = await getAccessToken();
  const videos = await apiFetch<Paginated<Video>>(
    '/videos/admin?status=active&page=1&pageSize=20',
    {},
    token,
  );

  return (
    <div className="container space-y-6 py-12">
      <AdminBrowseGrid initial={videos} />
    </div>
  );
}
