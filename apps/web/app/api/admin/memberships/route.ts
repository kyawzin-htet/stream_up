import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '../../../../lib/api';

export async function POST(req: Request) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const payload = await req.json();
  const res = await fetch(`${API_URL}/admin/memberships/${payload.userId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      membershipType: payload.membershipType,
      membershipExpiresAt: payload.membershipExpiresAt,
    }),
  });

  if (!res.ok) return new NextResponse(await res.text(), { status: res.status });
  return NextResponse.json(await res.json());
}

export async function PUT() {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const res = await fetch(`${API_URL}/admin/memberships/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return new NextResponse(await res.text(), { status: res.status });
  return NextResponse.json(await res.json());
}
