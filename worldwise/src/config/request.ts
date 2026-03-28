import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getStrapiApiBase, usesSessionCookie } from './strapiBase.js';

type RequestConfig<T = unknown> = AxiosRequestConfig & {
  retry?: number;
  skipErrorHandler?: boolean;
};

type ResponseData<T = unknown> = {
  code: number;
  message: string;
  data: T;
};

/** Strapi 常见 { error: { message, details } } */
function pickStrapiMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const d = data as Record<string, unknown>;
  if (typeof d.message === 'string') return d.message;
  const err = d.error;
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (typeof e.message === 'string') return e.message;
  }
  return '';
}

class Request {
  private instance: AxiosInstance;
  private retryLimit = 3;

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: usesSessionCookie()
    });
    this.initInterceptors();
  }

  private initInterceptors() {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (!usesSessionCookie()) {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse<ResponseData>) => {
        const { data } = response;
        return data as unknown as AxiosResponse;
      },
      async (error: AxiosError) => {
        const config = error.config as RequestConfig;
        if (config?.skipErrorHandler) {
          return Promise.reject(error);
        }
        const originalRequest = error.config as RequestConfig;
        if (!error.response) {
          return this.handleNetworkError(originalRequest);
        }
        if (error.response.status === 401) {
          if (usesSessionCookie()) {
            await fetch('/api/session/logout', { method: 'POST', credentials: 'include' });
          }
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('expiresAt');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        return this.handleServerError(error, originalRequest);
      }
    );
  }

  public request<T = unknown>(config: RequestConfig): Promise<T> {
    return this.instance.request(config);
  }

  private handleNetworkError(originalRequest: RequestConfig) {
    const method = (originalRequest.method || 'get').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return Promise.reject(new Error('Network Error'));
    }
    const retryCount = originalRequest.retry ?? 0;
    if (retryCount < this.retryLimit) {
      const delay = 1000 * Math.pow(2, retryCount);
      originalRequest.retry = retryCount + 1;
      return new Promise((resolve) =>
        setTimeout(() => resolve(this.instance(originalRequest)), delay)
      );
    }
    return Promise.reject(new Error('Network Error'));
  }

  private handleServerError(error: AxiosError, _config: RequestConfig) {
    const status = error.response?.status;
    const data = error.response?.data;
    const strapiMsg = pickStrapiMessage(data);
    const fallback =
      status === 500
        ? strapiMsg || '服务器内部错误'
        : status === 403
          ? strapiMsg || '无访问权限'
          : strapiMsg || (data as ResponseData)?.message || error.message || '未知错误';
    console.log('[request]', status, fallback);
    return Promise.reject({
      code: status || -1,
      message: strapiMsg || (data as ResponseData)?.message || error.message || '请求失败'
    });
  }
}

export const request = new Request(getStrapiApiBase());
