import { Readable } from 'stream';
import { readAuthToken, strapiOrigin } from '../../lib/strapiServerAuth.js';

const STRAPI_PROXY_PREFIX = '/api/strapi/';

/**
 * 优先用 req.url 的 pathname（与 HTTP 方法无关，DELETE 也完整）。
 * 部分环境下 req.query.slug 不全，只靠 query 会把 DELETE 打成 /api/cities 导致异常。
 */
function slugPath(req) {
  try {
    const host = req.headers.host || 'localhost';
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const u = new URL(req.url || '/', `${proto}://${host}`);
    if (u.pathname.startsWith(STRAPI_PROXY_PREFIX)) {
      const rest = u.pathname.slice(STRAPI_PROXY_PREFIX.length);
      if (rest) {
        try {
          return decodeURIComponent(rest);
        } catch {
          return rest;
        }
      }
    }
  } catch {
    /* ignore */
  }
  const s = req.query?.slug;
  if (s) return Array.isArray(s) ? s.join('/') : String(s);
  return '';
}

/**
 * Strapi 5：请求里若带有效 JWT，会只用 Authenticated 角色的能力，不会与 Public 合并。
 * cities 若仅对 Public 开放、Authenticated 未勾选对应权限，带 Bearer 反而会失败（403/404 等）。
 * 因此与「cities 无需登录」一致时，不向 Strapi 转发 Authorization。
 */
function isStrapiCitiesContentPath(pathPart) {
  return pathPart === 'cities' || pathPart.startsWith('cities/');
}

export default async function handler(req, res) {
  console.log('🔥 HIT /api/strapi');
  const pathPart = slugPath(req);
  console.log(`[BFF] ${req.method} ${req.url} -> pathPart:`, pathPart);
  if (!pathPart) {
    res.status(400).json({
      error: {
        message:
          'Strapi 代理路径为空。请确认请求为 /api/strapi/<资源路径>，且 Vercel 未错误改写 URL。'
      }
    });
    return;
  }
  const host = req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const urlObj = new URL(req.url, `${proto}://${host}`);
  const targetUrl = `${strapiOrigin()}/api/${pathPart}${urlObj.search}`;

  const token = readAuthToken(req);
  const headers = new Headers();
  if (token && !isStrapiCitiesContentPath(pathPart)) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const body =
    req.method === 'GET' || req.method === 'HEAD'
      ? undefined
      : req.body === undefined || req.body === null
        ? undefined
        : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body);

  /** 无 body（常见 DELETE）时不要带 Content-Type，避免 Strapi 对 application/json 空体返回 400/404 */
  if (body !== undefined) {
    const ct = req.headers['content-type'];
    if (typeof ct === 'string' && ct.trim()) {
      headers.set('content-type', ct);
    } else {
      headers.set('content-type', 'application/json');
    }
  }

  let upstream;
  try {
    upstream = await fetch(targetUrl, { method: req.method, headers, body });
  } catch {
    res.status(502).json({ error: { message: '无法连接 Strapi' } });
    return;
  }

  res.status(upstream.status);
  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === 'transfer-encoding' || k === 'connection') return;
    res.setHeader(key, value);
  });

  if (!upstream.body) {
    res.end();
    return;
  }

  Readable.fromWeb(upstream.body).pipe(res);
}
