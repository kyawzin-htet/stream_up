'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import type { Category } from '../lib/types';

export function UserShell({
  children,
  isAuthenticated,
  categories,
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
  categories: Category[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';

  const navItems = useMemo(
    () => [
      { label: 'Home', href: '/' },
      { label: 'Browse', href: '/search' },
      { label: 'Account', href: '/account' },
    ],
    [],
  );

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="user-shell min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-800/80 bg-slate-950/90 px-6 py-6 lg:flex">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
              ▶
            </span>
            StreamUp
          </Link>
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

          <div className="mt-8 flex flex-1 flex-col">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Categories</p>
            <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1 text-sm text-slate-400">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/search?category=${encodeURIComponent(category.slug)}`}
                  prefetch={false}
                  className="block rounded-lg px-2 py-1 hover:bg-slate-800/50 hover:text-white"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 px-4 py-4 backdrop-blur sm:px-6">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full items-center justify-center gap-3 text-center sm:w-auto sm:justify-start sm:text-left lg:hidden">
                <Link href="/" className="text-lg font-semibold">
                  StreamUp
                </Link>
              </div>
              <form action="/search" method="get" className="w-full sm:flex-1">
                <div className="relative">
                  <input
                    name="query"
                    defaultValue={query}
                    placeholder="Search movies, series, or keywords"
                    className="w-full rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none"
                  />
                </div>
              </form>
              {!isAuthenticated && (
                <div className="hidden items-center gap-3 sm:flex">
                  <Link
                    href="/login"
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-900"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.8),_rgba(2,6,23,0.9))] px-4 py-6 pb-24 sm:px-6">
            {children}
          </main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-800 bg-slate-950/95 px-4 py-3 text-xs text-slate-400 lg:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 ${
              isActive(item.href) ? 'text-emerald-300' : 'text-slate-400'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
