import '../styles/globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { getCurrentUser } from '../lib/auth';
import { apiFetch } from '../lib/api';
import type { Category } from '../lib/types';
import { UserShell } from '../components/UserShell';
import { AdminShell } from '../components/AdminShell';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'StreamUp — Telegram Video Library',
  description: 'Private video storage and community access powered by Telegram.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const isAdmin = Boolean(user?.isAdmin);
  let categories: Category[] = [];
  if (!isAdmin) {
    try {
      categories = await apiFetch<Category[]>('/categories');
    } catch {
      categories = [];
    }
  }

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} dark`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {isAdmin ? (
          <AdminShell>{children}</AdminShell>
        ) : (
          <UserShell isAuthenticated={Boolean(user)} categories={categories}>
            {children}
          </UserShell>
        )}
      </body>
    </html>
  );
}
