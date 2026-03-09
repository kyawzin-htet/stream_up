import { cookies } from 'next/headers';
import { LANGUAGE_COOKIE_NAME, normalizeLanguage } from './i18n';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type ApiFetchOptions = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

const DEFAULT_REVALIDATE = 30;

function resolveApiLanguage() {
  try {
    return normalizeLanguage(cookies().get(LANGUAGE_COOKIE_NAME)?.value);
  } catch {
    return 'en' as const;
  }
}

export function withApiLanguageHeaders(headersInit: HeadersInit = {}) {
  const headers = new Headers(headersInit);
  if (!headers.has('x-lang')) {
    headers.set('x-lang', resolveApiLanguage());
  }
  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
  token?: string,
): Promise<T> {
  const headers = withApiLanguageHeaders(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (options.method || 'GET').toUpperCase();
  const isPublicGet = method === 'GET' && !token;
  const hasCacheOverride = options.cache !== undefined;
  const hasNextOverride = options.next !== undefined;

  let cache = options.cache;
  let next = options.next;

  if (!hasCacheOverride && !hasNextOverride) {
    if (isPublicGet) {
      next = { revalidate: DEFAULT_REVALIDATE };
    } else {
      cache = 'no-store';
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    ...(cache !== undefined ? { cache } : {}),
    ...(next ? { next } : {}),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
