import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '../../../../lib/api';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: Request) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const search = url.searchParams.toString();
  const res = await fetch(`${API_URL}/videos/admin${search ? `?${search}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const payload = await res.json();
  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const contentType = req.headers.get('content-type') || '';
  const contentLength = req.headers.get('content-length') || '';
  const init: RequestInit & { duplex?: 'half' } = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(contentType ? { 'Content-Type': contentType } : {}),
      ...(contentLength ? { 'Content-Length': contentLength } : {}),
    },
    body: req.body,
    // Needed by Node fetch when forwarding request body streams.
    duplex: 'half',
  };

  const res = await fetch(`${API_URL}/videos`, init);

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const payload = await res.json();
  return NextResponse.json(payload);
}
