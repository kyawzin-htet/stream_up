'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Category } from '../lib/types';

export function AdminCategoryForm({ initial }: { initial: Category[] }) {
  function sortCategories(items: Category[]) {
    return [...items].sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime() || 0;
      const bTime = new Date(b.createdAt).getTime() || 0;
      return bTime - aTime;
    });
  }

  const [categories, setCategories] = useState<Category[]>(() => sortCategories(initial));
  const [status, setStatus] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) setStatus(null);
  }, [isOpen]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Creating category...');

    const form = event.currentTarget;
    const formData = new FormData(form);

    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'),
        slug: formData.get('slug'),
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const message = await res.text();
      setStatus(message || 'Failed to create category');
      return;
    }

    const category = await res.json();
    setCategories((prev) => sortCategories([category, ...prev]));
    setStatus(null);
    setIsOpen(false);
    form.reset();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => cat.name.toLowerCase().includes(q));
  }, [categories, query]);

  return (
    <div className="space-y-6">
     
        <div className="flex w-full items-center justify-between">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search category name"
            className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
          >
            Create
          </button>
        </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-[#2f2f2f]">
        <div className="grid grid-cols-[1.5fr_1fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:bg-[#202020] dark:text-slate-300">
          <div>Name</div>
          <div>Slug</div>
        </div>
        <div className="divide-y divide-slate-200">
          {filtered.map((cat) => (
            <div key={cat.id} className="grid grid-cols-[1.5fr_1fr] gap-4 px-4 py-3 text-sm">
              <div className="font-medium text-slate-700">{cat.name}</div>
              <div className="text-slate-500">{cat.slug}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-sm text-slate-500">No categories yet.</div>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lift dark:border dark:border-[#2f2f2f] dark:bg-[#202020] dark:text-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create category</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <input
                name="name"
                placeholder="Category name"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-[#2f2f2f] dark:bg-[#222222]"
                required
              />
              <input
                name="slug"
                placeholder="slug"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-[#2f2f2f] dark:bg-[#222222]"
                required
              />
              {status && <p className="text-sm text-slate-600">{status}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 dark:border-[#2f2f2f] dark:text-slate-200"
                >
                  Cancel
                </button>
                <button className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
