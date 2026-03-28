import { clearAuthCookie } from '../../lib/strapiServerAuth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  clearAuthCookie(res, req);
  res.status(200).json({ ok: true });
}
