const NAME = 'auth_token';

export function readAuthToken(req) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const m = raw.match(new RegExp(`(?:^|;\\s*)${NAME}=([^;]*)`));
  return m ? decodeURIComponent(m[1].trim()) : null;
}

export function setAuthCookie(res, jwt, maxAgeSec) {
  const secure = process.env.VERCEL === '1' ? '; Secure' : '';
  const v = encodeURIComponent(jwt);
  res.setHeader(
    'Set-Cookie',
    `${NAME}=${v}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}`
  );
}

export function clearAuthCookie(res) {
  const secure = process.env.VERCEL === '1' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${NAME}=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`);
}

export function strapiOrigin() {
  return (process.env.STRAPI_ORIGIN || 'http://118.31.55.213:1337').replace(/\/$/, '');
}
