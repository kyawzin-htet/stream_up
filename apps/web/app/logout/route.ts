import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

export async function GET() {
  const jar = cookies();
  jar.set('access_token', '', { httpOnly: true, path: '/', maxAge: 0 });

  const headerList = headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') || 'http';
  const url = `${proto}://${host}/`;

  return NextResponse.redirect(url);
}
