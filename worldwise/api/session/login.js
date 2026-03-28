import { setAuthCookie, strapiOrigin } from '../../lib/strapiServerAuth.js';

const MAX_AGE = 60 * 60 * 24 * 7;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  const origin = strapiOrigin();
  const r = await fetch(`${origin}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body || {})
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    res.status(r.status).json(data);
    return;
  }
  if (!data.jwt) {
    res.status(502).json({ error: { message: '登录响应无效' } });
    return;
  }
  setAuthCookie(res, data.jwt, MAX_AGE);
  res.status(200).json({ user: data.user });
}
