import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../../lib/auth';
import { apiFetch } from '../../../lib/api';
import type { Category } from '../../../lib/types';
import { AdminUploadForm } from '../../../components/AdminUploadForm';

export default async function AdminUploadPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/login');

  const categories = await apiFetch<Category[]>('/categories');

  return (
    <div className="container space-y-6 py-12">
      <div className="card p-8">
        <h1 className="text-2xl font-semibold">Upload video</h1>
        <p className="mt-2 text-sm text-slate-600">Videos are uploaded to Telegram channel and stored securely.</p>
        <div className="mt-6">
          <AdminUploadForm categories={categories} />
        </div>
      </div>
    </div>
  );
}
