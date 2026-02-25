'use client';

import { useState } from 'react';
import type { PricingPlan } from '../lib/types';
import { Toast } from './Toast';

export function AdminPricingPanel({
  currency,
  plans,
}: {
  currency: string;
  plans: PricingPlan[];
}) {
  const [currencyValue, setCurrencyValue] = useState(currency);
  const [planState, setPlanState] = useState(pricingToState(plans));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function pricingToState(items: PricingPlan[]) {
    return items.map((plan) => ({
      ...plan,
      amountValue: String(plan.amount),
    }));
  }

  async function saveCurrency() {
    const res = await fetch('/api/admin/pricing/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency: currencyValue.trim().toUpperCase() }),
    });

    if (!res.ok) {
      const message = await res.text();
      setToastMessage(message || 'Failed to update currency');
      return;
    }

    setToastMessage('Currency updated');
  }

  async function savePlan(id: string) {
    const plan = planState.find((item) => item.id === id);
    if (!plan) return;

    const res = await fetch(`/api/admin/pricing/plans/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(plan.amountValue),
        active: plan.active,
      }),
    });

    if (!res.ok) {
      const message = await res.text();
      setToastMessage(message || 'Failed to update plan');
      return;
    }

    const updated = await res.json();
    setPlanState((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, ...updated, amountValue: String(updated.amount) }
          : item,
      ),
    );
    setToastMessage('Plan updated');
  }

  return (
    <div className="card p-6">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <h2 className="text-lg font-semibold">Pricing plans</h2>
      <p className="mt-2 text-sm text-slate-600">Adjust plan pricing and currency.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={currencyValue}
          onChange={(event) => setCurrencyValue(event.target.value)}
          className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="Currency"
        />
        <button
          type="button"
          onClick={saveCurrency}
          className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
        >
          Update currency
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <div className="grid grid-cols-[1.2fr_0.8fr_0.6fr_auto] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-900/70">
          <div>Plan</div>
          <div>Amount</div>
          <div>Status</div>
          <div></div>
        </div>
        <div className="divide-y divide-slate-200">
          {planState.map((plan) => (
            <div key={plan.id} className="grid grid-cols-[1.2fr_0.8fr_0.6fr_auto] gap-4 px-4 py-3 text-sm">
              <div className="font-semibold text-slate-700">{plan.name}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{currencyValue}</span>
                <input
                  value={plan.amountValue}
                  onChange={(event) =>
                    setPlanState((prev) =>
                      prev.map((item) =>
                        item.id === plan.id ? { ...item, amountValue: event.target.value } : item,
                      ),
                    )
                  }
                  className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  setPlanState((prev) =>
                    prev.map((item) =>
                      item.id === plan.id ? { ...item, active: !item.active } : item,
                    ),
                  )
                }
                className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
              >
                {plan.active ? 'Active' : 'Hidden'}
              </button>
              <button
                type="button"
                onClick={() => savePlan(plan.id)}
                className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
              >
                Save
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
