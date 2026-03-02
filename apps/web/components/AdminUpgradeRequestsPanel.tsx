'use client';

import { useEffect, useState } from 'react';
import type { MembershipUpgradeRequest, Paginated } from '../lib/types';
import { Toast } from './Toast';

type SummaryRow = {
  planId: string;
  planName: string;
  currency: string;
  durationMonths: number | null;
  totalAmount: string;
  count: number;
};

export function AdminUpgradeRequestsPanel({
  initial,
  summary,
}: {
  initial: Paginated<MembershipUpgradeRequest>;
  summary: SummaryRow[];
}) {
  const [items, setItems] = useState(initial.items);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSlip, setActiveSlip] = useState<string | null>(null);

  useEffect(() => {
    setItems(initial.items);
    setActiveSlip(null);
  }, [initial.items]);

  async function handleDecision(id: string, action: 'approve' | 'reject') {
    const res = await fetch(`/api/admin/membership-upgrades/${id}/${action}`, {
      method: 'POST',
    });

    if (!res.ok) {
      const message = await res.text();
      setToastMessage(message || `Failed to ${action}`);
      return;
    }

    const updated = await res.json();
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (action === 'reject') {
          return {
            ...item,
            ...updated,
            user: item.user
              ? {
                  ...item.user,
                  membershipType: 'FREE',
                  membershipExpiresAt: null,
                }
              : item.user,
          };
        }
        return { ...item, ...updated };
      }),
    );
    setToastMessage(`Request ${action}d`);
  }

  return (
    <div className="card p-6">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <h2 className="text-lg font-semibold">Upgrade requests</h2>
      <p className="mt-2 text-sm text-slate-600">Review pay slips and approve premium access.</p>

      <details className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-700">
          Approved totals
        </summary>
        <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-900/70">
          <div>Plan</div>
          <div>Approved count</div>
          <div>Total amount</div>
        </div>
        <div className="divide-y divide-slate-200">
          {summary.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-500">No approved upgrades yet.</div>
          ) : (
            summary.map((row) => (
              <div key={row.planId} className="grid grid-cols-[1.5fr_0.8fr_0.8fr] gap-4 px-4 py-3 text-sm">
                <div className="font-semibold text-slate-700">{row.planName}</div>
                <div className="text-slate-600">{row.count}</div>
                <div className="text-slate-600">
                  {row.currency} {row.totalAmount}
                </div>
              </div>
            ))
          )}
        </div>
      </details>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <div className="grid grid-cols-[1.6fr_1fr_0.7fr_0.7fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-900/70">
          <div>Member</div>
          <div>Plan</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
        <div className="divide-y divide-slate-200">
          {items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500">No requests found.</div>
          ) : (
            items.map((request) => (
              <div key={request.id} className="grid grid-cols-[1.6fr_1fr_0.7fr_0.7fr] gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-700">{request.user?.email || request.userId}</p>
                  <p className="text-xs text-slate-500">
                    {request.currencySnapshot} {request.amountSnapshot}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Telegram: {request.user?.telegramUserId || '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Current: {request.user?.membershipType || 'FREE'}
                    {request.user?.membershipExpiresAt
                      ? ` (expires ${new Date(request.user.membershipExpiresAt).toLocaleDateString()})`
                      : ''}
                  </p>
                  <img
                    src={`/api/admin/membership-upgrades/${request.id}/slip`}
                    alt="Pay slip"
                    className="mt-2 h-20 w-28 cursor-zoom-in rounded-lg object-cover"
                    onClick={() => setActiveSlip(request.id)}
                  />
                </div>
                <div className="text-slate-600">{request.planNameSnapshot}</div>
                <div className="text-slate-600">{request.status}</div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecision(request.id, 'approve')}
                    disabled={request.status !== 'PENDING'}
                    className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(request.id, 'reject')}
                    disabled={request.status === 'REJECTED'}
                    className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {activeSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6">
          <div className="relative w-full max-w-5xl">
            <button
              type="button"
              onClick={() => setActiveSlip(null)}
              className="absolute -top-10 right-0 text-sm font-semibold text-white"
            >
              Close
            </button>
            <img
              src={`/api/admin/membership-upgrades/${activeSlip}/slip`}
              alt="Pay slip full"
              className="max-h-[80vh] w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
