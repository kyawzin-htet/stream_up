import '../styles/globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk, Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import { getCurrentUser } from '../lib/auth';
import { apiFetch } from '../lib/api';
import type { Category } from '../lib/types';
import { UserShell } from '../components/UserShell';
import { AdminShell } from '../components/AdminShell';
import { AutoLocalize } from '../components/AutoLocalize';
import { normalizeLanguage, LANGUAGE_COOKIE_NAME } from '../lib/i18n';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'StreamUp — Telegram Video Library',
  description: 'Private video storage and community access powered by Telegram.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const language = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
  const userPromise = getCurrentUser();
  const categoriesPromise = apiFetch<Category[]>('/categories');
  const user = await userPromise;
  const isAdmin = Boolean(user?.isAdmin);
  const isPremiumMember =
    user?.membershipType === 'PREMIUM' &&
    (!user.membershipExpiresAt || new Date(user.membershipExpiresAt).getTime() > Date.now());
  const canUseFavourites = Boolean(user && (isAdmin || isPremiumMember));
  let categories: Category[] = [];
  if (!isAdmin) {
    try {
      categories = await categoriesPromise;
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
      <body className="min-h-screen bg-[#181818] text-slate-100">
        <AutoLocalize language={language} />
        {isAdmin ? (
          <AdminShell language={language}>{children}</AdminShell>
        ) : (
          <UserShell
            isAuthenticated={Boolean(user)}
            canUseFavourites={canUseFavourites}
            categories={categories}
            language={language}
          >
            {children}
          </UserShell>
        )}
      </body>
    </html>
  );
}
