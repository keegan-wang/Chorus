import { createClient } from '@/lib/supabase/client';

// Hardcoded for now to bypass env caching issue
const API_URL = 'http://localhost:3001/api/v1';
// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    // For dev mode: use localStorage user data
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const user = storedUser ? JSON.parse(storedUser) : null;

    console.log('[API Client] User from localStorage:', user);

    const headers = {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
      // Dev mode headers (for demo purposes)
      ...(user?.id && {
        'x-user-id': user.id,
      }),
      ...(user?.organizationId && {
        'x-organization-id': user.organizationId,
      }),
    };

    console.log('[API Client] Headers being sent:', headers);

    return headers;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    // Ensure baseUrl ends with / and path doesn't start with /
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(cleanPath, base);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async fetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildUrl(path, params);
    const headers = await this.getAuthHeaders();

    console.log('[API Client] Making request to:', url);
    console.log('[API Client] Method:', fetchOptions.method || 'GET');

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...headers,
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new APIError(response.status, error.message || error.error || 'An error occurred', error.code);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.fetch<T>(path, { method: 'GET', params });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.fetch<T>(path, { method: 'DELETE' });
  }

  // File upload
  async uploadFile(path: string, file: File, additionalData?: Record<string, string>): Promise<unknown> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers: {
        ...(session?.access_token && {
          Authorization: `Bearer ${session.access_token}`,
        }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new APIError(response.status, error.message || 'Upload failed', error.code);
    }

    return response.json();
  }
}

export class APIError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

export const api = new APIClient(API_URL);

// Convenience exports for common endpoints
export const studiesApi = {
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('studies', params),
  get: (id: string) => api.get(`studies/${id}`),
  getStats: (id: string) => api.get(`studies/${id}/stats`),
  create: (data: unknown) => api.post('studies', data),
  update: (id: string, data: unknown) => api.patch(`studies/${id}`, data),
  delete: (id: string) => api.delete(`studies/${id}`),
  launch: (id: string, data?: unknown) => api.post(`studies/${id}/launch`, data),
  pause: (id: string) => api.post(`studies/${id}/pause`),
  resume: (id: string) => api.post(`studies/${id}/resume`),
  complete: (id: string) => api.post(`studies/${id}/complete`),
  analyze: (id: string) => api.post(`studies/${id}/analyze`),
  getAnalysis: (id: string) => api.get(`studies/${id}/analysis`),
  getAssignments: (id: string, params?: { status?: string; limit?: number; offset?: number }) =>
    api.get(`studies/${id}/assignments`, params),
  getSessions: (id: string, params?: { status?: string; limit?: number; offset?: number }) =>
    api.get(`studies/${id}/sessions`, params),
  getReport: (id: string) => api.get(`studies/${id}/report`),
  regenerateReport: (id: string) => api.post(`studies/${id}/report/regenerate`),
};

export const participantsApi = {
  list: (params?: { search?: string; tags?: string; status?: string; limit?: number; offset?: number }) =>
    api.get('participants', params),
  get: (id: string) => api.get(`participants/${id}`),
  create: (data: unknown) => api.post('participants', data),
  update: (id: string, data: unknown) => api.patch(`participants/${id}`, data),
  delete: (id: string) => api.delete(`participants/${id}`),
  import: (file: File, source: string) => api.uploadFile(`participants/import?source=${source}`, file),
  getImportJob: (id: string) => api.get(`participants/import/${id}`),
  importFromShopify: (filters?: unknown) => api.post('participants/import/shopify', filters),
};

export const reportsApi = {
  list: (params?: { study_id?: string; limit?: number }) => api.get('reports', params),
  get: (id: string) => api.get(`reports/${id}`),
};

export const integrationsApi = {
  list: () => api.get('integrations'),
  connectShopify: (shopDomain: string) => api.post('integrations/shopify/connect', { shop_domain: shopDomain }),
  disconnect: (provider: string) => api.delete(`integrations/${provider}`),
  sync: (provider: string) => api.post(`integrations/${provider}/sync`),
};

export const avatarsApi = {
  list: () => api.get('avatars'),
};

// Interview API (public, no auth)
export const interviewApi = {
  validate: (token: string) => api.get(`interview/${token}`),
  start: (token: string, data: unknown) => api.post(`interview/${token}/start`, data),
  submitAnswer: (token: string, data: unknown) => api.post(`interview/${token}/answer`, data),
  end: (token: string, data?: unknown) => api.post(`interview/${token}/end`, data),
  getStatus: (token: string) => api.get(`interview/${token}/status`),
};
