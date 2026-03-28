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
 * Strapi 5：Authenticated 未开 User→me 时 /users/me 常 403。
 * 若 Vercel 已配置 strapi_jwt_secret（与 Strapi 的 JWT_SECRET 一致），任意非 2xx 时可用 Cookie JWT 校验通过则返回 { user: { id } }，避免 /api/session/me 长期 403。
 * 未配置密钥时请在 Strapi 后台为 Authenticated 勾选 User 的 me，或补上环境变量。
 */
function getJwtSecret() {
  return process.env.strapi_jwt_secret || process.env.STRAPI_JWT_SECRET || '';
}

function userIdFromJwtPayload(decoded) {
  if (!decoded || typeof decoded !== 'object') return null;
  const raw = decoded.id ?? decoded.userId ?? decoded.sub;
  return raw == null ? null : raw;
}

function userFromVerifiedJwt(token) {
  const secret = getJwtSecret();
  if (!secret || !token) return null;
  try {
    const decoded = jwt.verify(token, secret);
    const id = userIdFromJwtPayload(decoded);
    if (id == null) return null;
    return { id };
  } catch {
    return null;
  }
}

/** Strapi 失败且 JWT 兜底也失败时，区分过期 / 密钥错误 / 未配密钥 */
function jwt401Hint(token) {
  const secret = getJwtSecret();
  if (!secret) {
    return {
      code: 'bff_no_jwt_secret',
      message: 'BFF 未配置 strapi_jwt_secret（或 STRAPI_JWT_SECRET），无法校验 Cookie'
    };
  }
  const dec = jwt.decode(token);
  if (dec && typeof dec === 'object' && typeof dec.exp === 'number' && Date.now() >= dec.exp * 1000) {
    return { code: 'jwt_expired', message: '登录已过期，请重新登录' };
  }
  return {
    code: 'jwt_verify_failed',
    message:
      'Cookie 中 JWT 与 STRAPI_JWT_SECRET 不匹配或已损坏，请重新登录，并核对 Vercel 与 Strapi 的 JWT_SECRET 完全一致'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  const token = readAuthToken(req);
  if (!token) {
    res.status(401).json({ error: { message: '未登录', code: 'no_cookie' } });
    return;
  }
  const origin = strapiOrigin();
  const r = await fetch(`${origin}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    // Strapi 常因 Authenticated 未开 User→me 返回 403；也可能其它非 2xx。有 JWT_SECRET 时用语义校验兜底，避免刷新永远 403。
    const fallback = userFromVerifiedJwt(token);
    if (fallback) {
      res.status(200).json({ user: fallback });
      return;
    }
    if (r.status === 401) {
      const hint = jwt401Hint(token);
      res.status(401).json({ error: hint, strapi: data?.error ?? data });
      return;
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
