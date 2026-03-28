import { Readable } from 'stream';
import { readAuthToken, strapiOrigin } from '../../lib/strapiServerAuth.js';

/** Vercel 有时不把 catch-all 填进 req.query，从 pathname 兜底 */
function slugPath(req) {
  const s = req.query.slug;
  if (s) return Array.isArray(s) ? s.join('/') : String(s);
  try {
    const host = req.headers.host || 'localhost';
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const u = new URL(req.url, `${proto}://${host}`);
    const prefix = '/api/strapi/';
    if (u.pathname.startsWith(prefix)) {
      const rest = u.pathname.slice(prefix.length);
      return rest ? decodeURIComponent(rest) : '';
    }
  } catch {
    /* ignore */
  }
  return '';
}

/**
 * Strapi 5：带有效 JWT 时只用 Authenticated 能力，不与 Public 合并。
 * cities：常见配置是 Public 只开 find（匿名能列表），create/delete 只给 Authenticated。
 * 若 cities 一律不传 Bearer，则 GET 能过、写操作会 403。
 * 因此 cities 仅在 GET/HEAD 省略 Authorization；写请求仍转发 Cookie 里的 JWT。
 */
function isStrapiCitiesContentPath(pathPart) {
  return pathPart === 'cities' || pathPart.startsWith('cities/');
}

function omitBearerForCitiesRead(method, pathPart) {
  const m = (method || 'GET').toUpperCase();
  return isStrapiCitiesContentPath(pathPart) && (m === 'GET' || m === 'HEAD');
}

export default async function handler(req, res) {
  const pathPart = slugPath(req);
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
  const ct = req.headers['content-type'];
  if (ct) headers.set('content-type', ct);
  if (token && !omitBearerForCitiesRead(req.method, pathPart)) {
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
