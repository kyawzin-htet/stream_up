export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type ApiFetchOptions = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

const DEFAULT_REVALIDATE = 30;

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (options.method || 'GET').toUpperCase();
  const shouldCache =
    method === 'GET' && !token && options.cache === undefined && options.next === undefined;
  const cache = options.cache ?? (shouldCache ? 'force-cache' : 'no-store');
  const next = options.next ?? (shouldCache ? { revalidate: DEFAULT_REVALIDATE } : undefined);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache,
    ...(next ? { next } : {}),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
