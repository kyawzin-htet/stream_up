'use client';

import { useState } from 'react';

export function TelegramLinkPanel() {
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleLink() {
    setStatus('Generating link...');
    const res = await fetch('/api/telegram/link', { method: 'POST' });
    if (!res.ok) {
      setStatus('Unable to generate link');
      return;
    }
    const data = await res.json();
    setLink(data.deepLink || null);
    setStatus('Link ready');
  }

  return (
    <div className="space-y-4">
      <button onClick={handleLink} className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
        Link Telegram Account
      </button>
      {status && <p className="text-sm text-slate-600">{status}</p>}
      {link && (
        <a href={link} className="text-sm font-semibold text-brand" target="_blank" rel="noreferrer">
          Open Telegram Bot
        </a>
      )}
    </div>
  );
}
