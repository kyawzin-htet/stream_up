import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, withApiLanguageHeaders } from '../../../../lib/api';

export async function GET(req: Request) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.toString();
  const res = await fetch(`${API_URL}/videos/favorites${search ? `?${search}` : ''}`, {
    headers: withApiLanguageHeaders({ Authorization: `Bearer ${token}` }),
    cache: 'no-store',
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}
