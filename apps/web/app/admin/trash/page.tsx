import { redirect } from 'next/navigation';
import { getAccessToken, getCurrentUser } from '../../../lib/auth';
import { apiFetch } from '../../../lib/api';
import type { Paginated, Video } from '../../../lib/types';
import { AdminTrashList } from '../../../components/AdminTrashList';

export default async function AdminTrashPage({
  searchParams,
}: {
  searchParams?: { query?: string; page?: string };
}) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/login');

  const query = searchParams?.query || '';
  const page = Number(searchParams?.page || '1');

  const token = await getAccessToken();
  const trashed = await apiFetch<Paginated<Video>>(
    `/videos/admin?status=trashed&query=${encodeURIComponent(query)}&page=${page}&pageSize=20`,
    {},
    token,
  );

  return (
    <div className="container space-y-6 py-12">
      <AdminTrashList initial={trashed} initialQuery={query} />
    </div>
  );
}
