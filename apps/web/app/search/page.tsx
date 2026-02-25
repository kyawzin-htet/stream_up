import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import type { Category, Paginated, Video } from '../../lib/types';
import { getCurrentUser } from '../../lib/auth';
import { BrowseVideoGrid } from '../../components/BrowseVideoGrid';

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: { query?: string; category?: string; page?: string };
}) {
  const query = searchParams?.query || '';
  const category = searchParams?.category || '';
  const page = Number(searchParams?.page || '1');

  const [videos, categories] = await Promise.all([
    apiFetch<Paginated<Video>>(
      `/videos?query=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}&page=${page}&pageSize=10`,
    ),
    apiFetch<Category[]>('/categories'),
  ]);
  const user = await getCurrentUser();
  const isAdmin = Boolean(user?.isAdmin);
  const showDateTime = isAdmin;
  const isPremiumMember =
    user?.membershipType === 'PREMIUM' &&
    (!user.membershipExpiresAt || new Date(user.membershipExpiresAt).getTime() > Date.now());
  const canAccessPremium = isAdmin || isPremiumMember;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Browse library</h1>
          <p className="mt-2 text-sm text-slate-400">
            {query ? `Results for "${query}"` : 'Explore the latest uploads and curated collections.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', name: 'All', slug: '' },
            ...categories,
          ].map((cat) => {
            const params = new URLSearchParams();
            if (query) params.set('query', query);
            if (cat.slug) params.set('category', cat.slug);
            return (
              <Link
                key={cat.id}
                href={`/search?${params.toString()}`}
                className={category === cat.slug ? 'tab-pill tab-pill-active' : 'tab-pill'}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>

      <BrowseVideoGrid
        key={`${query}:${category}`}
        initial={videos}
        query={query}
        category={category}
        canAccessPremium={canAccessPremium}
        showDateTime={showDateTime}
      />
    </div>
  );
}
