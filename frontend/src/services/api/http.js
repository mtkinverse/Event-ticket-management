const BASE = import.meta.env.VITE_API_URL;

export const req = async (path, opts = {}) => {
  const token       = localStorage.getItem('token');
  const isFormData  = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const wantsJson   = opts.body && !isFormData;

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(wantsJson ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Request failed');
  return body;
};
