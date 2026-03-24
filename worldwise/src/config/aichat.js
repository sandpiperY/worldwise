// Vite 的自定义环境变量必须是 VITE_ 前缀
export const AI_CHAT_CONFIG = {
  API_URL: `${(import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '')}/api/ai-chat/stream`
};