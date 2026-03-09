import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, withApiLanguageHeaders } from '../../../../../lib/api';

export const runtime = 'nodejs';

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.text();
  const res = await fetch(`${API_URL}/comments/${params.id}/replies`, {
    method: 'POST',
    headers: withApiLanguageHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    body,
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const payload = await res.json();
  return NextResponse.json(payload);
}
