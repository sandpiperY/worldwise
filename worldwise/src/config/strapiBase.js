/** Strapi 根地址（不含 /api、不含末尾 /），由 worldwise/.env 中 VITE_STRAPI_URL 注入 */
export function getStrapiOrigin() {
  return String(import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
}

export function getStrapiApiBase() {
  return `${getStrapiOrigin()}/api`;
}
