'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { AppLanguage, LANGUAGE_COOKIE_NAME, normalizeLanguage } from '../lib/i18n';

export function LanguageSwitch({ language }: { language: AppLanguage }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="inline-flex items-center">
      <select
        value={language}
        disabled={pending}
        onChange={(event) => {
          const next = normalizeLanguage(event.target.value);
          document.cookie = `${LANGUAGE_COOKIE_NAME}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
          startTransition(() => router.refresh());
        }}
        className="rounded-lg border border-[#2f2f2f] bg-[#222222] px-2 py-1 text-xs text-slate-100"
      >
        <option value="en">en</option>
        <option value="mm">mm</option>
      </select>
    </label>
  );
}
