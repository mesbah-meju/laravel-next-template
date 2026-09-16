'use client';

import { useState, useCallback } from 'react';
import { useToast } from './useToast';
import { parseApiError, FormattedApiError } from '@/lib/apiErrors';

export interface UseApiFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<unknown>;
  onSuccess?: (response: unknown) => void;
  successMessage?: string;
  successTitle?: string;
  errorMessage?: string;
}

export function useApiForm<T extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  onSuccess,
  successMessage,
  successTitle = 'Operation Successful',
  errorMessage,
}: UseApiFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const toast = useToast();

  const handleChange = useCallback((field: keyof T, value: unknown) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear specific field error on change
    setErrors((prev) => {
      if (!prev[field as string]) return prev;
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }, []);

  const reset = useCallback(
    (newValues?: T) => {
      setValues(newValues || initialValues);
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    },
    [initialValues]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setIsSubmitting(true);
      setErrors({});
      setGeneralError(null);

      try {
        const response = await onSubmit(values);
        if (successMessage) {
          toast.success(successTitle, successMessage);
        }
        if (onSuccess) {
          onSuccess(response);
        }
        return response;
      } catch (err: unknown) {
        const parsed: FormattedApiError = parseApiError(err);
        setErrors(parsed.errors);
        setGeneralError(parsed.message);

        const toastMsg = errorMessage || parsed.message;
        toast.error('Operation Failed', toastMsg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit, onSuccess, successMessage, successTitle, errorMessage, toast]
  );

  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      const fieldErrors = errors[field as string];
      return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined;
    },
    [errors]
  );

  return {
    values,
    setValues,
    errors,
    setErrors,
    generalError,
    setGeneralError,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    getFieldError,
  };
}
