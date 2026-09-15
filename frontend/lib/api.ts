import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

let csrfPromise: Promise<unknown> | null = null;

/**
 * Extract a cookie by name from document.cookie
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

/**
 * Ensures CSRF cookie is initialized from Laravel Sanctum for state-changing requests.
 */
export async function ensureCsrfCookie(): Promise<void> {
  if (!csrfPromise) {
    csrfPromise = apiClient
      .get('/sanctum/csrf-cookie')
      .catch((err) => {
        csrfPromise = null;
        throw err;
      });
  }
  await csrfPromise;
}

// Request interceptor to automatically fetch CSRF cookie for mutation requests
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = config.method?.toLowerCase();

  if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
    if (typeof window !== 'undefined' && !config.url?.includes('sanctum/csrf-cookie')) {
      try {
        await ensureCsrfCookie();
      } catch {
        // Continue if CSRF cookie request fails
      }

      // Explicitly attach X-XSRF-TOKEN if found in document.cookie
      const xsrfToken = getCookie('XSRF-TOKEN');
      if (xsrfToken && config.headers) {
        config.headers['X-XSRF-TOKEN'] = xsrfToken;
      }
    }
  }

  return config;
});

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Reset CSRF promise if CSRF mismatch occurs (HTTP 419)
    if (status === 419) {
      csrfPromise = null;
    }

    const formattedError = {
      status: status || 500,
      message: data?.message || error.message || 'An unexpected error occurred.',
      errors: data?.errors || {},
    };

    return Promise.reject(formattedError);
  }
);

export default apiClient;
