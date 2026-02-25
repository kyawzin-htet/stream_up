import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '../../../../lib/api';

export async function POST(req: Request) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.text();
  const res = await fetch(`${API_URL}/categories`, {
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

  return NextResponse.json(await res.json());
}
