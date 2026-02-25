import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '../../../../../../lib/api';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const res = await fetch(`${API_URL}/admin/membership-upgrades/${params.id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  return NextResponse.json(await res.json());
}
