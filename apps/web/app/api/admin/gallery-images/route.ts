import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL, withApiLanguageHeaders } from '../../../../lib/api';

export async function POST(req: Request) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const url = new URL(req.url);
  const isPremium = url.searchParams.get('isPremium') === 'true';
  const formData = await req.formData();

  const res = await fetch(`${API_URL}/gallery-images?isPremium=${isPremium ? 'true' : 'false'}`, {
    method: 'POST',
    headers: withApiLanguageHeaders({ Authorization: `Bearer ${token}` }),
    body: formData,
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  return NextResponse.json(await res.json());
}

export async function DELETE(req: Request) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const body = (await req.json().catch(() => null)) as { ids?: string[] } | null;
  const ids = Array.isArray(body?.ids) ? body!.ids : [];
  if (!ids.length) {
    return new NextResponse('Missing image group ids', { status: 400 });
  }

  const res = await fetch(`${API_URL}/gallery-images/bulk-delete`, {
    method: 'POST',
    headers: withApiLanguageHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({ ids }),
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  return NextResponse.json(await res.json());
}
