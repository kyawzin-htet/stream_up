'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetch } from './api';
import type { User } from './types';

const COOKIE_NAME = 'access_token';

type ActionState = {
  error?: string | null;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message || 'Request failed';
    try {
      const parsed = JSON.parse(message);
      if (typeof parsed === 'string') return parsed;
      if (Array.isArray(parsed?.message)) return parsed.message.join(', ');
      if (parsed?.message) return parsed.message;
    } catch {
      // ignore JSON parse errors
    }
    return message;
  }
  return 'Request failed';
}

function resolveFormData(arg1: unknown, arg2?: unknown) {
  if (arg1 instanceof FormData) return arg1;
  if (arg2 instanceof FormData) return arg2;
  throw new Error('Missing form data');
}

export async function loginAction(arg1: unknown, arg2?: unknown): Promise<ActionState | void> {
  const formData = resolveFormData(arg1, arg2);
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');

  let payload: { accessToken: string; user?: User };
  try {
    payload = await apiFetch<{ accessToken: string; user?: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    return { error: getErrorMessage(error) };
  }

  const jar = cookies();
  jar.set(COOKIE_NAME, payload.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  if (payload.user?.isAdmin) {
    redirect('/admin');
  }
  redirect('/');
}

export async function registerAction(arg1: unknown, arg2?: unknown): Promise<ActionState | void> {
  const formData = resolveFormData(arg1, arg2);
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');

  let payload: { accessToken: string };
  try {
    payload = await apiFetch<{ accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    return { error: getErrorMessage(error) };
  }

  const jar = cookies();
  jar.set(COOKIE_NAME, payload.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  redirect('/search');
}

export async function logoutAction() {
  const jar = cookies();
  jar.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
  redirect('/');
}

export async function getAccessToken() {
  return cookies().get(COOKIE_NAME)?.value;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return await apiFetch<User>('/auth/me', {}, token);
  } catch {
    return null;
  }
}
