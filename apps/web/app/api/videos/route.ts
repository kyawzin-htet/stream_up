import { NextResponse } from 'next/server';
import { API_URL } from '../../../lib/api';

export const revalidate = 30;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.toString();
  const res = await fetch(`${API_URL}/videos${search ? `?${search}` : ''}`, {
    next: { revalidate },
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json',
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
    },
  });
}
