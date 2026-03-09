import { redirect } from 'next/navigation';
import { getAccessToken, getCurrentUser, logoutAction } from '../../lib/auth';
import { apiFetch } from '../../lib/api';
import type { MembershipUpgradeRequest, PricingPlansResponse } from '../../lib/types';
import { MembershipUpgradePanel } from '../../components/MembershipUpgradePanel';

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const token = await getAccessToken();
  const showUpgradePanel = user.membershipType !== 'PREMIUM';

  let pricing: PricingPlansResponse | null = null;
  let requests: MembershipUpgradeRequest[] = [];

  if (showUpgradePanel) {
    [pricing, requests] = await Promise.all([
      apiFetch<PricingPlansResponse>('/pricing/plans'),
      token ? apiFetch<MembershipUpgradeRequest[]>('/membership-upgrades/me', {}, token) : [],
    ]);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className={showUpgradePanel ? 'grid gap-6 lg:grid-cols-[0.8fr_1.2fr]' : 'grid gap-6'}>
        <div className="space-y-4 rounded-2xl border border-[#2f2f2f] bg-[#202020] p-6 text-sm">
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
            <button className="w-full rounded-full border border-[#2f2f2f] px-6 py-3 text-xs font-semibold text-slate-100">
              Sign out
            </button>
          </form>
        </div>

        {showUpgradePanel && pricing && (
          <MembershipUpgradePanel
            currency={pricing.currency}
            plans={pricing.plans}
            initialRequests={requests}
          />
        )}
      </div>
    </div>
  );
}
