import { readAuthToken, strapiOrigin } from '../../lib/strapiServerAuth.js';

function normalizeStrapiUser(data) {
  if (!data || typeof data !== 'object') return null;
  let u = data.data !== undefined && data.id === undefined ? data.data : data;
  if (u && typeof u === 'object' && u.attributes && typeof u.attributes === 'object') {
    return {
      id: u.id,
      documentId: u.documentId,
      ...u.attributes
    };
  }
  return u;
}

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
  const user = normalizeStrapiUser(data);
  if (!user) {
    res.status(502).json({ error: { message: '用户数据格式异常' } });
    return;
  }
  res.status(200).json({ user });
}
