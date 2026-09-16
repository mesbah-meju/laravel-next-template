export interface FormattedApiError {
  status: number;
  message: string;
  errors: Record<string, string[]>;
}

export function parseApiError(err: unknown): FormattedApiError {
  if (!err) {
    return {
      status: 500,
      message: 'An unexpected error occurred.',
      errors: {},
    };
  }

  const e = err as {
    status?: number;
    message?: string;
    errors?: Record<string, string[]>;
    response?: {
      status?: number;
      data?: {
        message?: string;
        errors?: Record<string, string[]>;
      };
    };
  };

  const status = e.status || e.response?.status || 500;
  const rawErrors = e.errors || e.response?.data?.errors || {};
  let message = e.message || e.response?.data?.message;

  if (!message) {
    switch (status) {
      case 401:
        message = 'You are unauthenticated. Please sign in again.';
        break;
      case 403:
        message = 'You do not have permission to perform this action.';
        break;
      case 404:
        message = 'The requested resource could not be found.';
        break;
      case 419:
        message = 'Your session has expired. Please refresh and try again.';
        break;
      case 422:
        message = 'Validation failed. Please correct the highlighted errors.';
        break;
      case 429:
        message = 'Too many requests. Please slow down and try again shortly.';
        break;
      case 500:
      default:
        message = 'A server error occurred. Please try again later.';
        break;
    }
  }

  return {
    status,
    message,
    errors: rawErrors,
  };
}
