/** Minimal JSON fetch helper — extracts the API's `error` message on failure. */
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  }
  return body as T;
}

export interface LookupItem {
  id: number;
  label: string;
}

export interface Lookups {
  locations: LookupItem[];
  vendors: LookupItem[];
  staff: LookupItem[];
  assets: LookupItem[];
}
