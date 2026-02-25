import { redirect } from 'next/navigation';
import { getAccessToken, getCurrentUser, logoutAction } from '../../lib/auth';
import { apiFetch } from '../../lib/api';
import type { MembershipUpgradeRequest, PricingPlansResponse } from '../../lib/types';
import { MembershipUpgradePanel } from '../../components/MembershipUpgradePanel';

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const token = await getAccessToken();
  const [pricing, requests] = await Promise.all([
    apiFetch<PricingPlansResponse>('/pricing/plans'),
    token ? apiFetch<MembershipUpgradeRequest[]>('/membership-upgrades/me', {}, token) : [],
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold text-slate-100">Account</h1>
        <p className="mt-2 text-sm text-slate-400">Manage your membership and upgrade requests.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Membership</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{user.membershipType}</p>
            {user.membershipExpiresAt && (
              <p className="mt-2 text-xs text-slate-500">
                Expires {new Date(user.membershipExpiresAt).toLocaleString()}
              </p>
            )}
          </div>
          <form action={logoutAction}>
            <button className="w-full rounded-full border border-slate-700 px-6 py-3 text-xs font-semibold text-slate-100">
              Sign out
            </button>
          </form>
        </div>

        <MembershipUpgradePanel
          currency={pricing.currency}
          plans={pricing.plans}
          initialRequests={requests}
        />
      </div>
    </div>
  );
}
