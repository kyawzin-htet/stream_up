import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { apiFetch } from '../../../../lib/api';
import { getAccessToken, getCurrentUser } from '../../../../lib/auth';
import type { GalleryImageGroup } from '../../../../lib/types';
import { GalleryDetailView } from '../../../../components/GalleryDetailView';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const group = await apiFetch<GalleryImageGroup>(`/gallery-images/${params.id}`);
  return {
    title: `${group.title} — StreamUp Admin`,
    description: group.tags.length ? `Tagged with ${group.tags.join(', ')}` : 'Gallery image group',
  };
}

export default async function AdminGalleryDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/login');

  const token = await getAccessToken();
  const group = await apiFetch<GalleryImageGroup>(`/gallery-images/${params.id}`, {}, token);

  return (
    <GalleryDetailView
      group={group}
      backHref="/admin/gallary"
      isAuthenticated={true}
      locked={false}
    />
  );
}
