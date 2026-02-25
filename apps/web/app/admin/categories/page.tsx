import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../../lib/auth';
import { apiFetch } from '../../../lib/api';
import type { Category } from '../../../lib/types';
import { AdminCategoryForm } from '../../../components/AdminCategoryForm';

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/login');

  const categories = await apiFetch<Category[]>('/categories');

  return (
    <div className="container py-12">
      <div className="card p-8">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="mt-2 text-sm text-slate-600">Organize your library for search and browsing.</p>
        <div className="mt-6">
          <AdminCategoryForm initial={categories} />
        </div>
      </div>
    </div>
  );
}
