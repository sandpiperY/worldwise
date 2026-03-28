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

export default async function handler(req, res) {
  const pathPart = slugPath(req);
  const host = req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const urlObj = new URL(req.url, `${proto}://${host}`);
  const targetUrl = `${strapiOrigin()}/api/${pathPart}${urlObj.search}`;

  const token = readAuthToken(req);
  const headers = new Headers();
  const ct = req.headers['content-type'];
  if (ct) headers.set('content-type', ct);
  if (token) headers.set('authorization', `Bearer ${token}`);

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
