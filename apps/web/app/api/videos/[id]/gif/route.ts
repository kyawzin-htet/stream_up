import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, withApiLanguageHeaders } from '../../../../../lib/api';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const token = cookies().get('access_token')?.value;
  const isAuthed = Boolean(token);
  let res: globalThis.Response;
  try {
    res = await fetch(`${API_URL}/videos/${params.id}/gif`, {
      headers: withApiLanguageHeaders({
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }),
      ...(isAuthed ? { cache: 'no-store' as const } : { next: { revalidate: 24 * 60 * 60 } }),
    });
  } catch {
    return new NextResponse(null, {
      status: 502,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }

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
  if (!isAuthed && !headers.has('cache-control')) {
    headers.set('cache-control', 'public, max-age=31536000, immutable');
  }
  headers.set('content-length', String(body.byteLength));

  return new NextResponse(body, {
    status: res.status,
    headers,
  });
}
