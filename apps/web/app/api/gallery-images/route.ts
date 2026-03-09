import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, withApiLanguageHeaders } from '../../../lib/api';

export async function GET(req: Request) {
  const token = cookies().get('access_token')?.value;
  const url = new URL(req.url);
  const search = url.searchParams.toString();
  const res = await fetch(`${API_URL}/gallery-images${search ? `?${search}` : ''}`, {
    headers: withApiLanguageHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    cache: token ? 'no-store' : 'force-cache',
    ...(token ? {} : { next: { revalidate: 30 } }),
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json',
      'Cache-Control': token
        ? 'private, no-store'
        : 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
