import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '../../../../../lib/api';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const token = cookies().get('access_token')?.value;
  const res = await fetch(`${API_URL}/videos/${params.id}/gif`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  const headers = new Headers();
  const passthrough = [
    'content-type',
    'content-length',
    'cache-control',
    'content-disposition',
    'etag',
    'last-modified',
    'vary',
  ];
  passthrough.forEach((key) => {
    const value = res.headers.get(key);
    if (value) headers.set(key, value);
  });

  return new NextResponse(res.body, {
    status: res.status,
    headers,
  });
}
