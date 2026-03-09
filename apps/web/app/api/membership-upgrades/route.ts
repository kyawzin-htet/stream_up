import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, withApiLanguageHeaders } from '../../../lib/api';

export async function POST(req: Request) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const formData = await req.formData();
  const res = await fetch(`${API_URL}/membership-upgrades`, {
    method: 'POST',
    headers: withApiLanguageHeaders({
      Authorization: `Bearer ${token}`,
    }),
    body: formData,
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  return NextResponse.json(await res.json());
}
