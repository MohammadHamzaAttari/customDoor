// client/src/hooks/useFormValidation.ts
import { useState, useCallback, useMemo } from "react";
import { z } from "zod";
import { useSyncStatus } from "@/lib/stores/useSyncStatus";

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: Record<string, string>;
}

export function useFormValidation<T extends z.ZodType>(schema: T) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const { setFieldErrors: setSyncFieldErrors, clearFieldError } = useSyncStatus();

  const validateField = useCallback((
    fieldName: string,
    value: unknown,
    fullData: unknown
  ): string | null => {
    try {
      // For cross-field validation, we need to validate the whole object
      const result = schema.safeParse(fullData);

      if (!result.success) {
        const fieldError = result.error.issues.find(
          err => err.path.join('.') === fieldName || err.path[0] === fieldName
        );
        return fieldError?.message || null;
      }
      return null;
    } catch {
      return null;
    }
  }, [schema]);

  const validateForm = useCallback((data: unknown): ValidationResult<z.infer<T>> => {
    const result = schema.safeParse(data);

    if (result.success) {
      setFieldErrors({});
      setSyncFieldErrors({});
      return { success: true, data: result.data, errors: {} };
    }

    const errors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = err.message;
      }
    });

    setFieldErrors(errors);
    setSyncFieldErrors(errors);
    return { success: false, errors };
  }, [schema, setSyncFieldErrors]);

  const handleBlur = useCallback((fieldName: string, value: unknown, fullData: unknown) => {
    setTouched(prev => {
      const next = new Set(prev);
      next.add(fieldName);
      return next;
    });

    const error = validateField(fieldName, value, fullData);

    setFieldErrors(prev => {
      if (error) {
        return { ...prev, [fieldName]: error };
      }
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });

    if (error) {
      setSyncFieldErrors({ [fieldName]: error });
    } else {
      clearFieldError(fieldName);
    }
  }, [validateField, setSyncFieldErrors, clearFieldError]);

  const handleChange = useCallback((fieldName: string) => {
    // Clear error on change if field was touched
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      clearFieldError(fieldName);
    }
  }, [fieldErrors, clearFieldError]);

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return touched.has(fieldName) ? fieldErrors[fieldName] : undefined;
  }, [fieldErrors, touched]);

  const hasErrors = useMemo(() => Object.keys(fieldErrors).length > 0, [fieldErrors]);

  const markAllTouched = useCallback((data: Record<string, unknown>) => {
    const allFields = new Set(Object.keys(data));
    setTouched(allFields);
  }, []);

  const resetValidation = useCallback(() => {
    setFieldErrors({});
    setTouched(new Set());
    setSyncFieldErrors({});
  }, [setSyncFieldErrors]);

  return {
    fieldErrors,
    touched,
    hasErrors,
    validateForm,
    validateField,
    handleBlur,
    handleChange,
    getFieldError,
    markAllTouched,
    resetValidation,
  };
}