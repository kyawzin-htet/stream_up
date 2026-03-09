import { NextResponse } from 'next/server';
import { API_URL, withApiLanguageHeaders } from '../../../../../lib/api';

export const runtime = 'nodejs';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const res = await fetch(`${API_URL}/videos/${params.id}/watch`, {
    method: 'POST',
    headers: withApiLanguageHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  return NextResponse.json(await res.json());
}
