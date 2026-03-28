/** VITE_STRAPI_URL=same-origin 时走 Cookie 会话 + /api/strapi 代理；否则直连 Strapi 根地址（无 /api、无尾斜杠） */
export function getStrapiOrigin() {
  const v = String(import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337')
    .trim()
    .replace(/\/$/, '');
  return v === 'same-origin' ? '' : v;
}

/** 生产（同源）：Strapi 经服务端代理；开发直连：/api 在 Strapi 上 */
export function getStrapiApiBase() {
  const o = getStrapiOrigin();
  return o ? `${o}/api` : '/api/strapi';
}

export function usesSessionCookie() {
  return getStrapiOrigin() === '';
}
