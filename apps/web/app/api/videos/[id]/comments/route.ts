import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '../../../../../lib/api';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const res = await fetch(`${API_URL}/videos/${params.id}/comments`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const payload = await res.json();
  return NextResponse.json(payload);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.text();
  const res = await fetch(`${API_URL}/videos/${params.id}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const payload = await res.json();
  return NextResponse.json(payload);
}
