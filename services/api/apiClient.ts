import { ApiError } from '@/types/api';

const DEFAULT_BASE_URL = 'http://localhost:4000/api';

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') || DEFAULT_BASE_URL;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    }
    return {};
  }

  public async get<T>(
    endpoint: string,
    options: { headers?: HeadersInit; timeoutMs?: number } = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      timeoutMs: options.timeoutMs,
    });
  }

  public async post<T, B = unknown>(
    endpoint: string,
    body?: B,
    options: { headers?: HeadersInit; timeoutMs?: number } = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      timeoutMs: options.timeoutMs,
    });
  }

  public async patch<T, B = unknown>(
    endpoint: string,
    body: B,
    options: { headers?: HeadersInit; timeoutMs?: number } = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      timeoutMs: options.timeoutMs,
    });
  }

  public async delete<T>(
    endpoint: string,
    options: { headers?: HeadersInit; timeoutMs?: number } = {},
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      timeoutMs: options.timeoutMs,
    });
  }

  public async upload<T>(
    endpoint: string,
    formData: FormData,
    options: { headers?: HeadersInit; timeoutMs?: number } = {},
  ): Promise<T> {
    const authHeaders = this.getAuthHeaders();
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      timeoutMs: options.timeoutMs || 30000,
    });
  }

  private async request<T>(
    endpoint: string,
    config: RequestInit & { timeoutMs?: number },
  ): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, config.timeoutMs || 10000);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...config.headers,
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            statusCode: response.status,
            message: response.statusText || 'Unknown API error',
          };
        }
        throw errorData;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if ((err as Error)?.name === 'AbortError') {
        const timeoutError: ApiError = {
          statusCode: 408,
          message: 'Request timed out while connecting to the backend service.',
        };
        throw timeoutError;
      }
      if ((err as ApiError)?.statusCode) {
        throw err;
      }
      const genericError: ApiError = {
        statusCode: 0,
        message:
          (err as Error)?.message ||
          'Failed to connect to recruitment backend service.',
      };
      throw genericError;
    }
  }
}

export const apiClient = new ApiClient();
