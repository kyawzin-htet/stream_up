import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '../../../../lib/api';

export const runtime = 'nodejs';

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

  const formData = await req.formData();
  const res = await fetch(`${API_URL}/videos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const payload = await res.json();
  return NextResponse.json(payload);
}
