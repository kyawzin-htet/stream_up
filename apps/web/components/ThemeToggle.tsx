'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';
type Theme = 'light' | 'dark';

function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(resolveInitialTheme());
  }, []);

  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const label = theme === 'dark' ? 'Light' : theme === 'light' ? 'Dark' : 'Theme';

  return (
    <button
      type="button"
      onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
      aria-label="Toggle color theme"
    >
      {label}
    </button>
  );
}
