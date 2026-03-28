import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getStrapiApiBase } from './strapiBase.js';

// 扩展 Axios 默认请求配置
type RequestConfig<T = any> = AxiosRequestConfig & {
  retry?: number; // 自定义重试次数
  skipErrorHandler?: boolean; // 跳过统一错误处理
};

// 统一响应数据格式
type ResponseData<T = any> = {
  code: number; // 状态码
  message: string;
  data: T; // 数据
};

class Request {
  private instance: AxiosInstance;
  private retryLimit = 3; // 默认重试次数
  private isRefreshing = false; // Token刷新状态锁,防止重复刷新
  private retryQueue: Array<() => void> = []; // 重试队列,用于存储等待重试的请求
  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    this.initInterceptors();
  }

  private initInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig ) => {
        // 统一注入Token
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );
    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ResponseData>) => {
        const { data } = response;
        // console.log('response', response);
        return data as unknown as AxiosResponse; 
      },
      async (error: AxiosError) => {
        const config = error.config as RequestConfig;

        // 如果跳过全局错误处理
        if (config?.skipErrorHandler) {
          return Promise.reject(error);
        }
        // console.error('request error', error.response?.status, error.response?.data);
        const originalRequest = error.config as RequestConfig;
        
        // 网络错误处理
        if (!error.response) {
          return this.handleNetworkError(originalRequest);
        }
        // 授权过期处理
        if (error.response.status === 401) {
          return this.handleUnauthorized(originalRequest);
        }
        // 服务器错误处理
        return this.handleServerError(error, originalRequest);
      }
    );
  }
  // 统一请求方法（支持泛型）
  public request<T = any>(config: RequestConfig): Promise<T> {
    return this.instance.request(config);
  }

  // 授权过期处理
  private async handleUnauthorized(originalRequest: RequestConfig) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      try {
        const newToken = await refreshToken(); // 调用刷新Token接口
        localStorage.setItem('token', newToken);
        this.retryQueue.forEach(cb => cb()); // 执行重试队列中的请求
        return this.instance(originalRequest);
      } catch (e) {
        localStorage.removeItem('token');
        window.location.href = '/login'; // 跳转登录页
        return Promise.reject(e);
      } finally {
        this.isRefreshing = false;
        this.retryQueue = [];
      }
    }
    return new Promise((resolve) => {
      this.retryQueue.push(() => resolve(this.instance(originalRequest)));
    });
  }

  // 网络错误处理
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

  // 服务器错误处理
  private handleServerError(error: AxiosError, config: RequestConfig) {
    const status = error.response?.status;
    const data = error.response?.data as ResponseData;
    switch (status) {
      case 500:
        showError('服务器内部错误');
        break;
      case 403:
        showError('无访问权限');
        break;
      default:
        showError(data?.message || '未知错误');
    }
    
    return Promise.reject({
      code: status || -1,
      message: data?.message || error.message
    });
  }
}

async function refreshToken(): Promise<string> {
    try {
      // 假设你的刷新 token API 是 /auth/refresh
      const res = await axios.post<{ token: string }>(`${getStrapiApiBase()}/auth/refresh`, {
        // 可带上旧 token
        token: localStorage.getItem('token')
      });
      return res.data.token; // 返回新 token
    } catch (err) {
      console.error('刷新 token 失败', err);
      throw err;
    }
}

function showError(msg: string) {
    alert(msg);
}
  
export const request = new Request(getStrapiApiBase());