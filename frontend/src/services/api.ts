import type { ApiErrorResponse } from '../types/auth';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'dr_rauf_auth_token';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable
    }
  },
  remove: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // storage unavailable
    }
  }
};

export class ApiError extends Error {
  status: number;
  errorCode?: string;
  details?: unknown;

  constructor(message: string, status: number, errorCode?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 15000, headers = {}, ...customOptions } = options;
  const token = tokenStorage.get();

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      ...customOptions,
      headers: requestHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse JSON safely
    let data: unknown;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const anyData = data as Record<string, unknown> | undefined;
      const errorData = data as ApiErrorResponse | undefined;
      let message =
        errorData?.message ||
        (typeof anyData?.detail === 'string' ? anyData.detail : '') ||
        (Array.isArray(anyData?.detail)
          ? (anyData.detail as Array<{ msg?: string; loc?: string[] }>)
              .map((d) => d.msg || JSON.stringify(d))
              .join('; ')
          : '') ||
        (typeof data === 'string' && data ? data : '');

      const isGenericStatus = !message || message.startsWith('Request failed with status');

      // Human-friendly sanitization (Requirement 13)
      if (
        response.status === 422 ||
        (isGenericStatus && response.status === 422) ||
        message.toLowerCase().includes('unprocessable entity')
      ) {
        message = 'Please check the required fields.';
      } else if (
        response.status >= 500 ||
        (isGenericStatus && response.status >= 500) ||
        message.toLowerCase().includes('internal server error')
      ) {
        message = 'Unable to complete this action. Please try again.';
      } else if (isGenericStatus) {
        message = 'Unable to complete this action. Please try again.';
      }

      const errorCode = errorData?.error_code || `HTTP_${response.status}`;

      // If unauthorized on protected endpoint, clear sensitive token
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        tokenStorage.remove();
      }

      throw new ApiError(message, response.status, errorCode, errorData?.details);
    }

    return data as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }

    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408, 'TIMEOUT');
    }

    throw new ApiError(
      'Unable to complete this action. Please try again.',
      0,
      'NETWORK_ERROR'
    );
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  getBlob: async (endpoint: string): Promise<Blob> => {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${BASE_URL}${cleanEndpoint}`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new ApiError(`Failed to load file (${response.status})`, response.status);
    }
    return response.blob();
  },

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
    const token = tokenStorage.get();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${BASE_URL}${cleanEndpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      const errData = data as ApiErrorResponse | null;
      throw new ApiError(
        errData?.message || `Upload failed with status ${response.status}`,
        response.status,
        errData?.error_code,
        errData?.details
      );
    }
    return data as T;
  },
};
