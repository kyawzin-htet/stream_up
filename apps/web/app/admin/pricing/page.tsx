import { redirect } from 'next/navigation';
import { getAccessToken, getCurrentUser } from '../../../lib/auth';
import { apiFetch } from '../../../lib/api';
import type { PricingPlansResponse } from '../../../lib/types';
import { AdminPricingPanel } from '../../../components/AdminPricingPanel';

export default async function AdminPricingPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/login');

  const token = await getAccessToken();
  const pricing = await apiFetch<PricingPlansResponse>('/pricing/plans/all', {}, token);

  return (
    <div className="container py-12">
      <AdminPricingPanel currency={pricing.currency} plans={pricing.plans} />
    </div>
  );
}
