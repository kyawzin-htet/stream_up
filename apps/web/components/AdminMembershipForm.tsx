'use client';

import { useState } from 'react';

export function AdminMembershipForm() {
  const [status, setStatus] = useState<string | null>(null);

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Updating membership...');

    const formData = new FormData(event.currentTarget);
    const payload = {
      userId: formData.get('userId'),
      membershipType: formData.get('membershipType'),
      membershipExpiresAt: formData.get('membershipExpiresAt') || null,
    };

    const res = await fetch('/api/admin/memberships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const message = await res.text();
      setStatus(message || 'Update failed');
      return;
    }

    setStatus('Membership updated');
  }

  async function handleSync() {
    setStatus('Syncing Telegram group...');
    const res = await fetch('/api/admin/memberships', {
      method: 'PUT',
    });

    if (!res.ok) {
      const message = await res.text();
      setStatus(message || 'Sync failed');
      return;
    }

    setStatus('Sync complete');
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleUpdate} className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr_auto]">
        <input name="userId" placeholder="User ID" required className="rounded-xl border border-slate-200 px-4 py-3 text-sm" />
        <select name="membershipType" className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
          <option value="FREE">FREE</option>
          <option value="PREMIUM">PREMIUM</option>
        </select>
        <input
          name="membershipExpiresAt"
          type="datetime-local"
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
        />
        <button className="rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white">Update</button>
      </form>
      <button
        onClick={handleSync}
        className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold"
      >
        Force Telegram Sync
      </button>
      {status && <p className="text-sm text-slate-600">{status}</p>}
    </div>
  );
}
