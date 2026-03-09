import { NextResponse } from 'next/server';
import { API_URL, withApiLanguageHeaders } from '../../../../lib/api';

export async function POST(req: Request) {
  const body = await req.json();
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: withApiLanguageHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });

  const payload = await res.json();
  if (!res.ok) {
    return new NextResponse(JSON.stringify(payload), { status: res.status });
  }

  const response = NextResponse.json({ user: payload.user });
  response.cookies.set('access_token', payload.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return response;
}
