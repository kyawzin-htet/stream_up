import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '../../../../../lib/api';

export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const token = cookies().get('access_token')?.value;
  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const range = req.headers.get('range');
  const res = await fetch(`${API_URL}/videos/${params.id}/preview`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(range ? { Range: range } : {}),
    },
  });

  const headers = new Headers();
  const passthrough = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
  passthrough.forEach((key) => {
    const value = res.headers.get(key);
    if (value) headers.set(key, value);
  });

  return new NextResponse(res.body, {
    status: res.status,
    headers,
  });
}
