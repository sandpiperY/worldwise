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
  // Strapi v4 常见为扁平对象；v4 REST 也可能包一层 data
  const user =
    data && typeof data === 'object' && data.data !== undefined && !data.id
      ? data.data
      : data;
  res.status(200).json({ user });
}
