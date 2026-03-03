import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '../../../lib/api';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.toString();
  const token = cookies().get('access_token')?.value;
  const res = await fetch(`${API_URL}/videos${search ? `?${search}` : ''}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: token ? 'no-store' : 'force-cache',
    ...(token ? {} : { next: { revalidate: 10 } }),
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json',
      'Cache-Control': token
        ? 'private, no-store'
        : 'public, s-maxage=10, stale-while-revalidate=30',
    },
  });
}
