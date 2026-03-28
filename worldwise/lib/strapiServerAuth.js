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
  const m = raw.match(new RegExp(`(?:^|;\\s*)${NAME}=([^;]*)`));
  return m ? decodeURIComponent(m[1].trim()) : null;
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
  return (process.env.STRAPI_ORIGIN || 'http://118.31.55.213:1337').replace(/\/$/, '');
}
