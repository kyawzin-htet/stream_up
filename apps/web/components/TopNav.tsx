'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

type TopNavProps = {
  isAdmin: boolean;
  isAuthenticated: boolean;
};

function isActiveLink(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  if (href === '/search') return pathname.startsWith('/search');
  if (href === '/admin') return pathname === '/admin';
  return pathname.startsWith(href);
}

export default function TopNav({ isAdmin, isAuthenticated }: TopNavProps) {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const active = isActiveLink(pathname, href);
    return [
      'border-b-2',
      'pb-1',
      'transition',
      active
        ? 'border-ink text-ink dark:border-white dark:text-white'
        : 'border-transparent text-slate-600 hover:text-ink dark:text-slate-300 dark:hover:text-white',
    ].join(' ');
  };

  return (
    <nav className="flex items-center gap-4 text-sm font-medium">
      <Link href="/search" className={linkClass('/search')}>
        Browse
      </Link>
      {isAdmin ? (
        <>
          <Link href="/admin/upload" className={linkClass('/admin/upload')}>
            Upload video
          </Link>
          <Link href="/admin/categories" className={linkClass('/admin/categories')}>
            Manage categories
          </Link>
          <Link href="/admin/memberships" className={linkClass('/admin/memberships')}>
            Membership
          </Link>
          <Link href="/admin/pricing" className={linkClass('/admin/pricing')}>
            Pricing plans
          </Link>
        </>
      ) : isAuthenticated ? (
        <Link href="/account" className={linkClass('/account')}>
          Account
        </Link>
      ) : null}
      {isAuthenticated ? (
        isAdmin ? (
          <Link href="/logout" className={linkClass('/logout')}>
            Logout
          </Link>
        ) : null
      ) : (
        <>
          <Link href="/login" className={linkClass('/login')}>
            Login
          </Link>
          <Link href="/register" className={linkClass('/register')}>
            Register
          </Link>
        </>
      )}
      <ThemeToggle />
    </nav>
  );
}
