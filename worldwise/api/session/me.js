import jwt from 'jsonwebtoken';
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

/**
 * Strapi 5 users-permissions：若 Authenticated 未勾选 User → me，路由会 403 Forbidden（非转发写错）。
 * 用与 Strapi 相同的 JWT_SECRET 校验 Cookie 后返回最小 user，避免刷新后会话无法恢复。
 * 需设置 strapi_jwt_secret（或 STRAPI_JWT_SECRET），取值与 Strapi 的 JWT_SECRET 一致。
 */
function userFromVerifiedJwt(token) {
  const secret = process.env.strapi_jwt_secret || process.env.STRAPI_JWT_SECRET;
  if (!secret || !token) return null;
  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || typeof decoded !== 'object') return null;
    const id = decoded.id;
    if (id == null) return null;
    return { id };
  } catch {
    return null;
  }
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
    if (r.status === 403) {
      const fallback = userFromVerifiedJwt(token);
      if (fallback) {
        res.status(200).json({ user: fallback });
        return;
      }
    }
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
