/** VITE_STRAPI_URL=same-origin 时用同源 /api（配合 vercel.json 反代），否则为 Strapi 根地址（无 /api、无尾斜杠） */
export function getStrapiOrigin() {
  const v = String(import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337')
    .trim()
    .replace(/\/$/, '');
  return v === 'same-origin' ? '' : v;
}

export function getStrapiApiBase() {
  const o = getStrapiOrigin();
  return o ? `${o}/api` : '/api';
}
