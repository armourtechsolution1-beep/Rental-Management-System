import { getSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { ApiError, type ApiErrorPayload } from './api-error';

type RequestInterceptor = (init: RequestInit) => Promise<RequestInit> | RequestInit;
type ResponseInterceptor = (res: Response) => Promise<Response> | Response;

interface RequestConfig extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip the global toast-on-error behavior (e.g. for silent background polls). */
  silent?: boolean;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

class ApiClient {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor() {
    // --- Default request interceptor: attach bearer token + JSON headers ---
    this.useRequestInterceptor(async (init) => {
      const session = await getSession();
      const headers = new Headers(init.headers);
      headers.set('Content-Type', 'application/json');
      if (session?.user) {
        // If you wire NextAuth to mint a Supabase-compatible JWT, attach it here.
        const token = (session as { accessToken?: string }).accessToken;
        if (token) headers.set('Authorization', `Bearer ${token}`);
      }
      return { ...init, headers };
    });
  }

  useRequestInterceptor(fn: RequestInterceptor) {
    this.requestInterceptors.push(fn);
  }

  useResponseInterceptor(fn: ResponseInterceptor) {
    this.responseInterceptors.push(fn);
  }

  private async buildRequest(init: RequestInit): Promise<RequestInit> {
    let config = init;
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }
    return config;
  }

  private async handleResponse<T>(res: Response, silent?: boolean): Promise<T> {
    let response = res;
    for (const interceptor of this.responseInterceptors) {
      response = await interceptor(response);
    }

    if (!response.ok) {
      let payload: ApiErrorPayload = { message: response.statusText };
      try {
        payload = await response.json();
      } catch {
        // Non-JSON error body — fall back to statusText.
      }

      const error = new ApiError(
        payload.message || 'Something went wrong',
        response.status,
        payload.code,
        payload.details
      );

      // --- Global response interceptor behavior ---
      if (error.isAuthError) {
        // Session expired or invalid — force a clean logout instead of looping 401s.
        if (!silent) toast.error('Your session has expired. Please log in again.');
        await signOut({ redirect: true, redirectTo: '/login' });
      } else if (!silent) {
        if (error.isServerError) {
          toast.error('Server error — please try again in a moment.');
        } else if (!error.isValidationError) {
          // Validation errors are usually surfaced inline by forms (Zod/RHF),
          // so we don't double-toast those.
          toast.error(error.message);
        }
      }

      throw error;
    }

    // 204 No Content etc.
    if (response.status === 204) return undefined as T;

    return response.json() as Promise<T>;
  }

  private async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const { body, silent, ...rest } = config;

    const init = await this.buildRequest({
      ...rest,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const res = await fetch(`${BASE_URL}${path}`, init);
    return this.handleResponse<T>(res, silent);
  }

  get<T>(path: string, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: 'POST', body });
  }

  patch<T>(path: string, body?: unknown, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: 'PATCH', body });
  }

  put<T>(path: string, body?: unknown, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: 'PUT', body });
  }

  delete<T>(path: string, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: 'DELETE' });
  }
}

/** Singleton — import this everywhere instead of constructing your own. */
export const apiClient = new ApiClient();
