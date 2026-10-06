import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiClientError, errorMessage } from '@/lib/api';

/**
 * Map server-side `fieldErrors` onto form fields. `aliases` maps API field names to form field names.
 * Returns the number of errors that were mapped.
 */
export function applyFieldErrors<T extends FieldValues>(
  e: unknown,
  fields: readonly string[],
  setError: UseFormSetError<T>,
  aliases: Record<string, string> = {},
): number {
  if (!(e instanceof ApiClientError) || !e.fieldErrors) return 0;
  let mapped = 0;
  for (const [apiField, msg] of Object.entries(e.fieldErrors)) {
    const field = aliases[apiField] ?? apiField;
    if (fields.includes(field)) {
      setError(field as Path<T>, { type: 'server', message: msg });
      mapped++;
    }
  }
  return mapped;
}

export interface FriendlyError {
  title: string;
  detail?: string;
}

/** Friendly copy for IMAP connect / update failures. */
export function imapErrorMessage(e: unknown): FriendlyError {
  if (!(e instanceof ApiClientError)) return { title: errorMessage(e) };
  const server = e.message?.trim();
  const withDetail = (title: string): FriendlyError =>
    server && server.toLowerCase() !== title.toLowerCase() ? { title, detail: server } : { title };

  switch (e.code) {
    case 'IMAP_AUTH_FAILED':
      return withDetail('Authentication failed. Check the email address and app password.');
    case 'IMAP_CONNECTION_FAILED':
      return withDetail('Could not connect to the IMAP server. Check the host, port and SSL settings, and that IMAP access is enabled for this mailbox.');
    case 'IMAP_TIMEOUT':
      return withDetail('The IMAP server did not respond in time. Check the host and port, then try again.');
    case 'MAILBOX_UNAVAILABLE':
      return withDetail('The mailbox could not be opened. Check the folder name (usually INBOX) and try again.');
    case 'CONFLICT':
      return { title: 'This email account is already connected.' };
    default:
      return { title: errorMessage(e) };
  }
}
