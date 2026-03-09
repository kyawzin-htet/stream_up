import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, withApiLanguageHeaders } from '../../../../lib/api';

export async function GET(req: Request) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const res = await fetch(`${API_URL}/admin/membership-upgrades?${searchParams.toString()}`, {
    headers: withApiLanguageHeaders({ Authorization: `Bearer ${token}` }),
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  return NextResponse.json(await res.json());
}
