'use client';

import { useState } from 'react';
import type { MembershipUpgradeRequest, PricingPlan } from '../lib/types';
import { Toast } from './Toast';

export function MembershipUpgradePanel({
  currency,
  plans,
  initialRequests,
}: {
  currency: string;
  plans: PricingPlan[];
  initialRequests: MembershipUpgradeRequest[];
}) {
  const [requests, setRequests] = useState<MembershipUpgradeRequest[]>(initialRequests);
  const [planId, setPlanId] = useState(plans[0]?.id || '');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const hasActiveRequest = requests.some(
    (request) => request.status === 'PENDING' || request.status === 'APPROVED',
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !planId) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('planId', planId);
      if (note.trim()) formData.append('note', note.trim());

      const res = await fetch('/api/membership-upgrades', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Failed to submit pay slip');
      }

      const created = await res.json();
      setRequests((prev) => [created, ...prev]);
      setFile(null);
      setNote('');
      setToastMessage('Pay slip submitted. Awaiting approval.');
    } catch (error: any) {
      setToastMessage(error?.message || 'Failed to submit pay slip');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#2f2f2f] bg-[#202020] p-6 text-sm">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <h3 className="text-base font-semibold text-slate-100">Upgrade to Premium</h3>
      <p className="mt-2 text-xs text-slate-400">
        Upload a pay slip. An admin will review and approve your premium access.
      </p>

      {hasActiveRequest ? (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          You already have a pending or approved request. Please wait until it is resolved.
        </div>
      ) : plans.length === 0 ? (
        <p className="mt-4 text-xs text-slate-500">No plans available right now.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <label className="text-xs font-semibold uppercase text-slate-500">Select plan</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((plan) => {
            const active = planId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setPlanId(plan.id)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  active
                    ? 'border-emerald-300 bg-emerald-400/10 text-emerald-200'
                    : 'border-[#2f2f2f] text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="text-base font-semibold text-slate-100">{plan.name}</div>
                <div className="mt-1 text-xs uppercase text-slate-500">
                  {currency} {plan.amount}
                </div>
              </button>
            );
          })}
        </div>

        <label className="text-xs font-semibold uppercase text-slate-500">Pay slip (JPG/PNG)</label>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className="rounded-xl border border-[#2f2f2f] bg-[#222222] px-3 py-2 text-sm text-slate-100"
          required
        />

        <label className="text-xs font-semibold uppercase text-slate-500">Note (optional)</label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="rounded-xl border border-[#2f2f2f] bg-[#222222] px-3 py-2 text-sm text-slate-100"
          rows={3}
        />

        <button
          className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
          disabled={loading || !planId}
        >
          {loading ? 'Submitting...' : 'Submit for review'}
        </button>
      </form>
      )}

      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase text-slate-500">Your requests</h4>
        <div className="mt-2 space-y-2">
          {requests.length === 0 ? (
            <p className="text-xs text-slate-500">No requests yet.</p>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2f2f2f] bg-[#222222] px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{request.planNameSnapshot}</p>
                  <p className="text-xs text-slate-500">
                    {request.currencySnapshot} {request.amountSnapshot}
                  </p>
                </div>
                <span className="rounded-full bg-[#202020] px-3 py-1 text-xs font-semibold text-slate-300">
                  {request.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
