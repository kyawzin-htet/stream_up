import Link from 'next/link';
import { getAccessToken, getCurrentUser } from '../../lib/auth';
import { apiFetch } from '../../lib/api';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return (
      <div className="container py-16">
        <div className="card p-8">
          <h1 className="text-2xl font-semibold">Admin access required</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in with an admin account.</p>
        </div>
      </div>
    );
  }

  const token = await getAccessToken();
  const status = await apiFetch<{
    users: number;
    videos: number;
    categories: number;
    linkedUsers: number;
    premiumUsers: number;
    premiumLinked: number;
  }>(
    '/admin/status',
    {},
    token,
  );

  return (
    <div className="container py-12">
      <div className="grid gap-6">
        <div className="card p-6">
          <h1 className="text-2xl font-semibold">Admin control</h1>
          <p className="mt-2 text-sm text-slate-600">Manage uploads, categories, and membership sync.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Users</p>
              <p className="text-xl font-semibold">{status.users}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Videos</p>
              <p className="text-xl font-semibold">{status.videos}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Categories</p>
              <p className="text-xl font-semibold">{status.categories}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Linked Telegram</p>
              <p className="text-xl font-semibold">{status.linkedUsers}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Premium Users</p>
              <p className="text-xl font-semibold">{status.premiumUsers}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-500">Premium Linked</p>
              <p className="text-xl font-semibold">{status.premiumLinked}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/admin/upload" className="card p-6">
            <h2 className="text-lg font-semibold">Upload videos</h2>
            <p className="mt-2 text-sm text-slate-600">Push new content to Telegram channel.</p>
          </Link>
          <Link href="/admin/categories" className="card p-6">
            <h2 className="text-lg font-semibold">Manage categories</h2>
            <p className="mt-2 text-sm text-slate-600">Create or update categories.</p>
          </Link>
          <Link href="/admin/memberships" className="card p-6">
            <h2 className="text-lg font-semibold">Membership sync</h2>
            <p className="mt-2 text-sm text-slate-600">Grant access or re-sync group members.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
