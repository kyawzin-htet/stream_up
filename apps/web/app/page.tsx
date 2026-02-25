import Link from 'next/link';
import { apiFetch } from '../lib/api';
import type { Paginated, Video } from '../lib/types';
import { HomeVideoSections } from '../components/HomeVideoSections';
import { getCurrentUser } from '../lib/auth';

export default async function HomePage() {
  const data = await apiFetch<Paginated<Video>>('/videos?page=1&pageSize=10');
  const user = await getCurrentUser();
  const isAdmin = Boolean(user?.isAdmin);
  const showDateTime = isAdmin;
  const isPremiumMember =
    user?.membershipType === 'PREMIUM' &&
    (!user.membershipExpiresAt || new Date(user.membershipExpiresAt).getTime() > Date.now());
  const canAccessPremium = isAdmin || isPremiumMember;

  const featured = data.items[0];
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="rounded-3xl border border-slate-800/70 bg-slate-900/40 p-5 sm:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">StreamUp library</p>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl md:text-4xl">
              Discover fresh uploads, curated playlists, and premium releases.
            </h1>
            <p className="mt-3 text-sm text-slate-400">
              Search the archive, preview instantly, and upgrade when you are ready to unlock premium access.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/search" className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-semibold text-slate-900">
                Browse Videos
              </Link>
              {!user && (
                <Link
                  href="/register"
                  className="rounded-full border border-slate-700 px-5 py-2 text-xs font-semibold text-slate-100"
                >
                  Create Account
                </Link>
              )}
            </div>
          </div>
          {featured ? (
            <Link
              href={`/videos/${featured.id}`}
              className="group relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/60"
            >
              <div className="aspect-video w-full overflow-hidden">
                <video
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  muted
                  playsInline
                  preload="metadata"
                  src={`/api/videos/${featured.id}/preview`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
              </div>
              <div className="absolute bottom-5 left-5 right-5 space-y-1">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Featured</p>
                <h3 className="text-lg font-semibold text-white">{featured.title}</h3>
                <p className="text-xs text-slate-300">{featured.description}</p>
              </div>
            </Link>
          ) : null}
        </div>
      </section>

      <HomeVideoSections
        initial={data}
        canAccessPremium={canAccessPremium}
        showDateTime={showDateTime}
      />
    </div>
  );
}
