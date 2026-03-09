import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, withApiLanguageHeaders } from '../../../../../lib/api';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const token = cookies().get('access_token')?.value;
  const res = await fetch(`${API_URL}/videos/${params.id}/favorite`, {
    headers: withApiLanguageHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  return NextResponse.json(await res.json());
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const res = await fetch(`${API_URL}/videos/${params.id}/favorite`, {
    method: 'POST',
    headers: withApiLanguageHeaders({
      Authorization: `Bearer ${token}`,
    }),
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  return NextResponse.json(await res.json());
}
