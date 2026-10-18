/**
 * Turns technical Supabase / network errors into short, plain-English messages for
 * the admin dashboard. The full technical detail is always written to the browser
 * console and kept in a small in-memory log for the developer System Check page.
 */

export interface DiagnosticEntry {
  at: string;
  context: string;
  code?: string;
  message: string;
}

const MAX_ENTRIES = 50;
const diagnostics: DiagnosticEntry[] = [];

export function getDiagnostics(): DiagnosticEntry[] {
  return [...diagnostics].reverse();
}

export function logTechnicalError(context: string, err: unknown) {
  const e = err as { code?: string; message?: string; details?: string; hint?: string } | undefined;
  const message = [e?.message ?? String(err), e?.details, e?.hint].filter(Boolean).join(' — ');
  diagnostics.push({ at: new Date().toISOString(), context, code: e?.code, message });
  if (diagnostics.length > MAX_ENTRIES) diagnostics.shift();
  console.error(`[admin] ${context}:`, err);
}

/** A database column or table the code expects is missing (setup script not yet run). */
export function isMissingSchemaError(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | undefined;
  const code = e?.code ?? '';
  const message = e?.message ?? '';
  return (
    code === '42703' || // undefined_column
    code === '42P01' || // undefined_table
    code === 'PGRST204' || // column not in schema cache
    code === 'PGRST205' || // table not in schema cache
    /column .* does not exist|could not find the .* (column|table)|relation .* does not exist/i.test(message)
  );
}

export function isMissingBucketError(err: unknown): boolean {
  return /bucket not found/i.test((err as { message?: string } | undefined)?.message ?? '');
}

/** Error whose message is already written for the site owner. */
export class FriendlyError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'FriendlyError';
    this.cause = cause;
  }
}

export const SETUP_NEEDED_MESSAGE =
  'This feature needs a one-time setup by your website developer. Your other content is not affected.';

/**
 * Logs the technical error and returns a message suitable for the site owner.
 * `fallback` is used when nothing more specific applies.
 */
export function friendlyError(err: unknown, context: string, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof FriendlyError) {
    if (err.cause) logTechnicalError(context, err.cause);
    return err.message;
  }
  logTechnicalError(context, err);

  const e = err as { code?: string; message?: string; status?: number; statusCode?: string } | undefined;
  const code = e?.code ?? '';
  const message = e?.message ?? '';

  if (isMissingSchemaError(err) || isMissingBucketError(err)) return SETUP_NEEDED_MESSAGE;
  if (code === '23505' || /duplicate key/i.test(message)) return 'This item already exists.';
  if (code === '23503' || /foreign key/i.test(message)) {
    return /delete/i.test(message)
      ? 'This category still has work in it. Move or delete that work first.'
      : 'Please choose a category from the list.';
  }
  if (code === '42501' || /row-level security|permission denied|unauthori[sz]ed|jwt/i.test(message) || e?.status === 401 || e?.status === 403) {
    return 'You don\'t have permission to make this change. Please sign out and sign in again.';
  }
  if (/exceeded the maximum allowed size|too large|payload/i.test(message) || e?.status === 413) {
    return 'This file is too large. Please choose a smaller file.';
  }
  if (/mime type|invalid_mime_type|not supported/i.test(message) || e?.status === 415) {
    return 'This file type is not supported. Please use JPG, PNG, WebP, MP4 or MOV.';
  }
  if (/failed to fetch|network|timeout|load failed/i.test(message)) {
    return 'Connection problem. Please check your internet connection and try again.';
  }
  return fallback;
}

/** Logs `err` and returns a FriendlyError carrying the plain-English message (for hooks to throw). */
export function toFriendly(err: unknown, context: string, fallback?: string): FriendlyError {
  return new FriendlyError(friendlyError(err, context, fallback));
}
