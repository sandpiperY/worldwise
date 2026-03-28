import { readAuthToken, strapiOrigin } from '../../lib/strapiServerAuth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  const token = readAuthToken(req);
  if (!token) {
    res.status(401).json({ error: { message: '未登录' } });
    return;
  }
  const origin = strapiOrigin();
  const r = await fetch(`${origin}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    res.status(r.status).json(data);
    return;
  }
  res.status(200).json({ user: data });
}
