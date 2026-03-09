import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, withApiLanguageHeaders } from '../../../../lib/api';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const token = cookies().get('access_token')?.value;
  const res = await fetch(`${API_URL}/gallery-images/${params.id}`, {
    headers: withApiLanguageHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    cache: token ? 'no-store' : 'force-cache',
    ...(token ? {} : { next: { revalidate: 30 } }),
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  return NextResponse.json(await res.json());
}
