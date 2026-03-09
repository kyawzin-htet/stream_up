'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { logoutAction } from '../lib/auth';
import type { AppLanguage } from '../lib/i18n';
import { LanguageSwitch } from './LanguageSwitch';

export function AdminShell({
  children,
  language,
}: {
  children: React.ReactNode;
  language: AppLanguage;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const showHeader = pathname.startsWith('/admin/browse');

  const navItems = useMemo(
    () => [
      { label: 'Dashboard', href: '/admin' },
      { label: 'Browse', href: '/admin/browse' },
      { label: 'Gallary', href: '/admin/gallary' },
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

  const mobileNavItems = useMemo(
    () => [
      { label: 'Home', href: '/admin' },
      { label: 'Browse', href: '/admin/browse' },
      { label: 'Gallary', href: '/admin/gallary' },
      { label: 'Upload', href: '/admin/upload' },
      { label: 'Members', href: '/admin/memberships' },
      { label: 'Trash', href: '/admin/trash' },
    ],
    [],
  );

  return (
    <div className="min-h-screen  bg-[#181818] pb-20 text-slate-100 lg:pb-0">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-[#2f2f2f]  bg-[#181818]/90 px-6 py-6 lg:flex">
          <div className="flex items-center gap-3 text-lg font-semibold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#2f2f2f] bg-[#202020] text-emerald-300">
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
                    ? 'border border-[#2f2f2f] bg-[#202020] text-white'
                    : 'text-slate-400 hover:bg-[#202020] hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${isActive(item.href) ? 'bg-emerald-300' : 'bg-transparent'}`} />
              </Link>
            ))}
          </div>
          <div className="mt-auto">
            <form action={logoutAction}>
              <button className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-[#2f2f2f] px-4 py-2 text-xs font-semibold text-slate-200">
                Logout
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header
            className={`sticky top-0 z-40 border-b border-[#2f2f2f]  bg-[#181818]/80 px-4 py-3 backdrop-blur sm:px-6 ${
              showHeader ? '' : 'lg:hidden'
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3 lg:hidden">
                <span className="text-lg font-semibold">Admin</span>
                <div className="flex items-center gap-2">
                  <LanguageSwitch language={language} />
                  <form action={logoutAction}>
                    <button className="inline-flex items-center justify-center rounded-full border border-[#2f2f2f] px-3 py-1.5 text-[11px] font-semibold text-slate-200">
                      Logout
                    </button>
                  </form>
                </div>
              </div>
              <div className="hidden lg:flex lg:justify-end">
                <LanguageSwitch language={language} />
              </div>
              {showHeader && (
                <form action="/search" method="get" className="flex-1">
                  <div className="relative">
                    <input
                      name="query"
                      defaultValue={query}
                      placeholder="Search videos, members, or categories"
                      className="w-full rounded-2xl border border-[#2f2f2f] bg-[#202020] px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none"
                    />
                  </div>
                </form>
              )}
            </div>
          </header>

          <main className="flex-1 bg-[#181818] px-4 py-6 pb-20 sm:px-6">
            {children}
          </main>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#2f2f2f]  bg-[#181818]/95 px-3 py-3 text-xs text-slate-400 lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 ${
                isActive(item.href)
                  ? 'border border-[#2f2f2f] bg-[#202020] text-emerald-300'
                  : 'bg-[#202020] text-slate-400'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
