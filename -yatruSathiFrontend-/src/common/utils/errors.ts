import { MESSAGES } from '../constants/messages';

/**
 * Shape-agnostic error message extraction.
 *
 * The backend returns errors as `{ error: { code, message, details? } }`.
 * Older endpoints and DRF defaults may instead return `{ error: "..." }`,
 * `{ detail: "..." }`, or serializer field maps. This handles all of them.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback: string = MESSAGES.genericError
): string {
  const anyErr = error as {
    response?: { data?: unknown; status?: number };
    message?: string;
    code?: string;
  };

  if (anyErr?.code === 'ERR_NETWORK') return MESSAGES.networkError;

  const data = anyErr?.response?.data;
  if (data == null) return anyErr?.message || fallback;
  if (typeof data === 'string') return data || fallback;

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    // New envelope: { error: { message } }
    const err = obj.error;
    if (
      err &&
      typeof err === 'object' &&
      typeof (err as Record<string, unknown>).message === 'string'
    ) {
      return (err as Record<string, string>).message;
    }
    if (typeof err === 'string' && err) return err;

    if (typeof obj.detail === 'string' && obj.detail) return obj.detail;
    if (typeof obj.message === 'string' && obj.message) return obj.message;

    // Serializer field errors: { field: ["msg", ...] }
    const firstField = Object.values(obj).find(
      v => typeof v === 'string' || (Array.isArray(v) && v.length > 0)
    );
    if (Array.isArray(firstField)) return String(firstField[0]);
    if (typeof firstField === 'string') return firstField;
  }

  return fallback;
}

/** The machine-readable code from the error envelope, when present. */
export function getApiErrorCode(error: unknown): string | undefined {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === 'object') {
    const err = (data as Record<string, unknown>).error;
    if (err && typeof err === 'object') {
      const code = (err as Record<string, unknown>).code;
      if (typeof code === 'string') return code;
    }
  }
  return undefined;
}
