import { redirect } from 'next/navigation';
import { getAccessToken, getCurrentUser } from '../../../lib/auth';
import { apiFetch } from '../../../lib/api';
import type { GalleryImageGroup, Paginated } from '../../../lib/types';
import { AdminGallaryPanel } from '../../../components/AdminGallaryPanel';

export default async function AdminGallaryPage({
  searchParams,
}: {
  searchParams?: { query?: string };
}) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/login');

  const token = await getAccessToken();
  const query = (searchParams?.query || '').trim();
  const params = new URLSearchParams({
    page: '1',
    pageSize: '24',
  });
  if (query) params.set('query', query);

  const initial = await apiFetch<Paginated<GalleryImageGroup>>(
    `/gallery-images?${params.toString()}`,
    {},
    token,
  );

  return (
    <div className="space-y-6">
      <AdminGallaryPanel initial={initial} query={query} />
    </div>
  );
}
