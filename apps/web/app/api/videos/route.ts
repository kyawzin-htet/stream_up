import { NextResponse } from 'next/server';
import { API_URL } from '../../../lib/api';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.toString();
  const res = await fetch(`${API_URL}/videos${search ? `?${search}` : ''}`, {
    cache: 'no-store',
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('content-type') || 'application/json',
    },
  });
}
