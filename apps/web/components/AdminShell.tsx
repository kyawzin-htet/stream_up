'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { logoutAction } from '../lib/auth';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const showHeader = pathname.startsWith('/admin/browse');

  const navItems = useMemo(
    () => [
      { label: 'Dashboard', href: '/admin' },
      { label: 'Browse', href: '/admin/browse' },
      { label: 'Upload video', href: '/admin/upload' },
      { label: 'Manage categories', href: '/admin/categories' },
      { label: 'Membership', href: '/admin/memberships' },
      { label: 'Pricing plans', href: '/admin/pricing' },
      { label: 'Trash', href: '/admin/trash' },
    ],
    [],
  );

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-800/80 bg-slate-950/90 px-6 py-6 lg:flex">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
              ▲
            </span>
            Admin
          </div>
          <div className="mt-6 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive(item.href)
                    ? 'bg-slate-800/80 text-white'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${isActive(item.href) ? 'bg-emerald-300' : 'bg-transparent'}`} />
              </Link>
            ))}
          </div>
          <div className="mt-auto">
            <form action={logoutAction}>
              <button className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200">
                Logout
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          {showHeader && (
            <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 px-4 py-4 backdrop-blur sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 lg:hidden">
                  <span className="text-lg font-semibold">Admin</span>
                </div>
                <form action="/search" method="get" className="flex-1">
                  <div className="relative">
                    <input
                      name="query"
                      defaultValue={query}
                      placeholder="Search videos, members, or categories"
                      className="w-full rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none"
                    />
                  </div>
                </form>
              </div>
            </header>
          )}

          <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.8),_rgba(2,6,23,0.9))] px-4 py-6 pb-20 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
