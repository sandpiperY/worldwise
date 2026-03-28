const NAME = 'auth_token';

/**
 * 本地 http（含 vercel dev）不能加 Secure，否则浏览器会丢弃 Set-Cookie。
 * 线上 Vercel 为 https + x-forwarded-proto=https。
 */
function secureCookieSuffix(req) {
  if (req?.headers?.['x-forwarded-proto'] === 'http') return '';
  if (process.env.VERCEL !== '1') return '';
  if (process.env.VERCEL_ENV === 'development') return '';
  return '; Secure';
}

export function readAuthToken(req) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const parts = raw.split(';');
  for (const p of parts) {
    const i = p.indexOf('=');
    if (i === -1) continue;
    const k = p.slice(0, i).trim();
    if (k !== NAME) continue;
    const v = p.slice(i + 1).trim();
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }
  return null;
}

export function setAuthCookie(res, jwt, maxAgeSec, req) {
  const v = encodeURIComponent(jwt);
  res.setHeader(
    'Set-Cookie',
    `${NAME}=${v}; HttpOnly${secureCookieSuffix(req)}; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}`
  );
}

export function clearAuthCookie(res, req) {
  res.setHeader(
    'Set-Cookie',
    `${NAME}=; HttpOnly${secureCookieSuffix(req)}; SameSite=Lax; Path=/; Max-Age=0`
  );
}

export function strapiOrigin() {
  let o = String(
      process.env.STRAPI_ORIGIN ||
      'http://118.31.55.213:1337'
  )
    .trim()
    .replace(/\/+$/, '');
  if (/\/api\/?$/i.test(o)) {
    o = o.replace(/\/api\/?$/i, '');
  }
  return o.replace(/\/+$/, '');
}
