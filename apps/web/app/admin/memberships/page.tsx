import { redirect } from 'next/navigation';
import { getAccessToken, getCurrentUser } from '../../../lib/auth';
import { AdminMembershipForm } from '../../../components/AdminMembershipForm';
import { apiFetch } from '../../../lib/api';
import type { Member, MembershipUpgradeRequest, Paginated } from '../../../lib/types';
import Link from 'next/link';
import { AdminUpgradeRequestsPanel } from '../../../components/AdminUpgradeRequestsPanel';

export default async function AdminMembershipsPage({
  searchParams,
}: {
  searchParams?: { query?: string; membership?: string; page?: string };
}) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) redirect('/login');

  const query = searchParams?.query || '';
  const membership = searchParams?.membership || 'ALL';
  const page = Number(searchParams?.page || '1');
  const upgradeStatus = searchParams?.upgradeStatus || 'PENDING';
  const upgradePage = Number(searchParams?.upgradePage || '1');

  const params = new URLSearchParams({
    query,
    membership: membership === 'ALL' ? '' : membership,
    page: String(page),
    pageSize: '20',
  });

  const token = await getAccessToken();
  const upgradeParams = new URLSearchParams({
    page: String(upgradePage),
    pageSize: '10',
  });
  if (upgradeStatus !== 'ALL') upgradeParams.set('status', upgradeStatus);

  const [data, upgrades, summary] = await Promise.all([
    apiFetch<Paginated<Member>>(`/admin/members?${params.toString()}`, {}, token),
    apiFetch<Paginated<MembershipUpgradeRequest>>(
      `/admin/membership-upgrades?${upgradeParams.toString()}`,
      {},
      token,
    ),
    apiFetch<
      {
        planId: string;
        planName: string;
        currency: string;
        durationMonths: number | null;
        totalAmount: string;
        count: number;
      }[]
    >('/admin/membership-upgrades/summary', {}, token),
  ]);

  const tabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Free', value: 'FREE' },
    { label: 'Premium', value: 'PREMIUM' },
  ];

  return (
    <div className="container py-12">
      {false && (
        <div className="card p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Membership management</h1>
              <p className="mt-2 text-sm text-slate-600">
                View members, update tiers, and sync Telegram access.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <AdminMembershipForm />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const tabParams = new URLSearchParams({
                query,
                membership: tab.value === 'ALL' ? '' : tab.value,
                page: '1',
              });
              const active = membership === tab.value;
              return (
                <Link
                  key={tab.value}
                  href={`/admin/memberships?${tabParams.toString()}`}
                  className={active ? 'tab-pill tab-pill-active' : 'tab-pill'}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <form className="mt-6 flex flex-wrap gap-3" method="get">
            <input type="hidden" name="membership" value={membership} />
            <input
              name="query"
              defaultValue={query}
              placeholder="Search email or Telegram ID"
              className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2 text-sm"
            />
            <button className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">
              Search
            </button>
          </form>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:bg-slate-900/70 dark:text-slate-300">
              <div>Email</div>
              <div>Telegram ID</div>
              <div>Membership</div>
              <div>Joined</div>
            </div>
            <div className="divide-y divide-slate-200">
              {data.items.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">No members found.</div>
              ) : (
                data.items.map((member) => (
                  <div key={member.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-4 py-3 text-sm">
                    <div className="font-medium text-slate-700">{member.email}</div>
                    <div className="text-slate-500">{member.telegramUserId || '—'}</div>
                    <div className="text-slate-600">
                      {member.membershipType === 'PREMIUM' ? 'Premium' : 'Free'}
                    </div>
                    <div className="text-slate-500">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            {Array.from({ length: data.totalPages }).map((_, index) => {
              const pageNum = index + 1;
              const pagerParams = new URLSearchParams({
                query,
                membership: membership === 'ALL' ? '' : membership,
                page: String(pageNum),
              });
              return (
                <Link
                  key={pageNum}
                  href={`/admin/memberships?${pagerParams.toString()}`}
                  className={`rounded-full px-4 py-2 text-sm ${pageNum === data.page ? 'bg-ink text-white' : 'border border-slate-200'}`}
                >
                  {pageNum}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => {
            const tabParams = new URLSearchParams({
              query,
              membership: membership === 'ALL' ? '' : membership,
              page: String(page),
              upgradeStatus: status,
              upgradePage: '1',
            });
            const active = upgradeStatus === status;
            return (
              <Link
                key={status}
                href={`/admin/memberships?${tabParams.toString()}`}
                className={active ? 'tab-pill tab-pill-active' : 'tab-pill'}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </Link>
            );
          })}
        </div>
        <AdminUpgradeRequestsPanel initial={upgrades} summary={summary} />
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: upgrades.totalPages }).map((_, index) => {
            const pageNum = index + 1;
            const pagerParams = new URLSearchParams({
              query,
              membership: membership === 'ALL' ? '' : membership,
              page: String(page),
              upgradeStatus,
              upgradePage: String(pageNum),
            });
            return (
              <Link
                key={pageNum}
                href={`/admin/memberships?${pagerParams.toString()}`}
                className={`rounded-full px-4 py-2 text-sm ${pageNum === upgrades.page ? 'bg-ink text-white' : 'border border-slate-200'}`}
              >
                {pageNum}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
