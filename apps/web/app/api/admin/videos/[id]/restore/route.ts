import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_URL } from '../../../../../../lib/api';

export const runtime = 'nodejs';

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const token = cookies().get('access_token')?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const res = await fetch(`${API_URL}/videos/${params.id}/restore`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    return new NextResponse(await res.text(), { status: res.status });
  }

  const payload = await res.json();
  return NextResponse.json(payload);
}
