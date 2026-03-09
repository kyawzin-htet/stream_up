import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, withApiLanguageHeaders } from '../../../../../lib/api';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const token = cookies().get('access_token')?.value;
  const range = req.headers.get('range');
  const res = await fetch(`${API_URL}/videos/${params.id}/stream`, {
    headers: withApiLanguageHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(range ? { Range: range } : {}),
    }),
  });

  const headers = new Headers();
  const passthrough = [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges',
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
