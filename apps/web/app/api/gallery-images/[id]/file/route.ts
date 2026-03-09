import { NextResponse } from 'next/server';
import { API_URL, withApiLanguageHeaders } from '../../../../../lib/api';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const res = await fetch(`${API_URL}/gallery-images/${params.id}/file`, {
    headers: withApiLanguageHeaders(),
    next: { revalidate: 60 },
  });

  const body = await res.arrayBuffer();
  const headers = new Headers();
  const passthrough = [
    'content-type',
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
  if (!headers.has('cache-control')) {
    headers.set('cache-control', 'public, max-age=31536000, immutable');
  }
  headers.set('content-length', String(body.byteLength));

  return new NextResponse(body, {
    status: res.status,
    headers,
  });
}
