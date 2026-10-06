import {
  differenceInCalendarDays,
  differenceInMinutes,
  differenceInSeconds,
  format,
  formatDistanceToNowStrict,
  isThisYear,
  isToday,
  isTomorrow,
  isValid,
  isYesterday,
  parseISO,
} from 'date-fns';

/** Parse an ISO instant or a plain YYYY-MM-DD date (as local date). */
export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseISO(value) : new Date(value);
  return isValid(d) ? d : null;
}

/** "Just now", "5m ago", "2h ago", "Yesterday", "Oct 05", "Oct 05, 2025" */
export function relativeTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  const now = new Date();
  const secs = differenceInSeconds(now, d);
  if (secs < 0) {
    // future
    if (isToday(d)) return `Today ${format(d, 'p')}`;
    if (isTomorrow(d)) return `Tomorrow ${format(d, 'p')}`;
    const days = differenceInCalendarDays(d, now);
    if (days < 7) return `In ${days}d`;
    return format(d, isThisYear(d) ? 'MMM dd' : 'MMM dd, yyyy');
  }
  if (secs < 45) return 'Just now';
  const mins = differenceInMinutes(now, d);
  if (mins < 60) return `${mins}m ago`;
  if (isToday(d)) return `${Math.floor(mins / 60)}h ago`;
  if (isYesterday(d)) return 'Yesterday';
  const days = differenceInCalendarDays(now, d);
  if (days < 7) return `${days}d ago`;
  return format(d, isThisYear(d) ? 'MMM dd' : 'MMM dd, yyyy');
}

/** "2 minutes ago" style for sentences. */
export function relativeLong(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return 'never';
  if (Math.abs(differenceInSeconds(new Date(), d)) < 45) return 'just now';
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function fullTimestamp(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return format(d, 'EEEE, MMMM d, yyyy');
  return format(d, "EEE, MMM d, yyyy 'at' h:mm a");
}

/** "Oct 05, 2026" */
export function shortDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return format(d, isThisYear(d) ? 'MMM dd' : 'MMM dd, yyyy');
}

export function mediumDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return format(d, 'MMM dd, yyyy');
}

export function dateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '—';
  return format(d, isThisYear(d) ? 'MMM d, h:mm a' : 'MMM d, yyyy, h:mm a');
}

export function timeOnly(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return '';
  return format(d, 'h:mm a');
}

/** YYYY-MM-DD for a local Date */
export function isoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function percent(v: number | null | undefined, digits = 0): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${(v * 100).toFixed(digits)}%`;
}

export function number(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString();
}

export function days(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const r = Math.round(v * 10) / 10;
  return `${r} ${r === 1 ? 'day' : 'days'}`;
}

export function salaryRange(min: number | null, max: number | null, currency: string | null): string | null {
  if (min === null && max === null) return null;
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: currency ? 'currency' : 'decimal',
        currency: currency ?? undefined,
        maximumFractionDigits: 0,
        notation: n >= 100000 ? 'compact' : 'standard',
      }).format(n);
    } catch {
      return `${n.toLocaleString()}${currency ? ` ${currency}` : ''}`;
    }
  };
  if (min !== null && max !== null) return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
  if (min !== null) return `From ${fmt(min)}`;
  return `Up to ${fmt(max as number)}`;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(displayName: string | null | undefined): string {
  if (!displayName) return '';
  return displayName.trim().split(/\s+/)[0];
}
