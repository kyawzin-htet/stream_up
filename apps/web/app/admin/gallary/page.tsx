import { redirect } from 'next/navigation';
import { getAccessToken, getCurrentUser } from '../../../lib/auth';
import { apiFetch } from '../../../lib/api';
import type { GalleryImage, Paginated } from '../../../lib/types';
import { AdminGallaryPanel } from '../../../components/AdminGallaryPanel';

export default async function AdminGallaryPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/login');

  const token = await getAccessToken();
  const initial = await apiFetch<Paginated<GalleryImage>>(
    '/gallery-images?page=1&pageSize=24',
    {},
    token,
  );

  return (
    <div className="space-y-6">
      <AdminGallaryPanel initial={initial} />
    </div>
  );
}
