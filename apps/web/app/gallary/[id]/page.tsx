import type { Metadata } from 'next';
import { apiFetch } from '../../../lib/api';
import { getAccessToken, getCurrentUser } from '../../../lib/auth';
import type { GalleryImageGroup } from '../../../lib/types';
import { GalleryDetailView } from '../../../components/GalleryDetailView';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const group = await apiFetch<GalleryImageGroup>(`/gallery-images/${params.id}`);
  return {
    title: `${group.title} — StreamUp`,
    description: group.tags.length ? `Tagged with ${group.tags.join(', ')}` : 'Gallery image group',
  };
}

export default async function GalleryDetailPage({ params }: { params: { id: string } }) {
  const [token, user] = await Promise.all([getAccessToken(), getCurrentUser()]);
  const group = await apiFetch<GalleryImageGroup>(`/gallery-images/${params.id}`, {}, token);

  const isAdmin = Boolean(user?.isAdmin);
  const hasPremium =
    user?.membershipType === 'PREMIUM' &&
    (!user.membershipExpiresAt || new Date(user.membershipExpiresAt).getTime() > Date.now());
  const canAccessPremium = isAdmin || hasPremium;
  const locked = group.isPremium && !canAccessPremium;

  return <GalleryDetailView group={group} backHref="/gallary" isAuthenticated={Boolean(user)} locked={locked} />;
}
