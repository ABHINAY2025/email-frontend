import { HueBadge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { CLASSIFICATION_META, PROVIDER_META, SYNC_STATUS_META } from '@/lib/classification';
import { HUE_CLASSES, STATUS_META } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { ApplicationStatus, EmailClassification, EmailProvider, SyncStatus } from '@/types/api';

export function StatusBadge({ status, className }: { status: ApplicationStatus | null | undefined; className?: string }) {
  if (!status) return <span className="text-xs text-subtle">—</span>;
  const m = STATUS_META[status];
  return (
    <HueBadge hue={m.hue} className={className} title={m.description}>
      {m.label}
    </HueBadge>
  );
}

/** Bare status dot + label (no box), for dense inline contexts. */
export function StatusDot({ status, className, showLabel = true }: { status: ApplicationStatus; className?: string; showLabel?: boolean }) {
  const m = STATUS_META[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', className)}>
      <span className={cn('size-1.5 shrink-0 rounded-full', HUE_CLASSES[m.hue].dot)} />
      {showLabel && <span className="text-foreground/90">{m.label}</span>}
    </span>
  );
}

export function ClassificationBadge({ value, className }: { value: EmailClassification; className?: string }) {
  const m = CLASSIFICATION_META[value];
  return (
    <HueBadge hue={m.hue} icon={m.icon} className={className}>
      {m.label}
    </HueBadge>
  );
}

export function SyncStatusBadge({ value, className }: { value: SyncStatus; className?: string }) {
  const m = SYNC_STATUS_META[value];
  return (
    <HueBadge hue={m.hue} className={cn(value === 'SYNCING' && '[&>span:first-child]:animate-pulse', className)}>
      {m.label}
    </HueBadge>
  );
}

export function ProviderMark({ provider, className }: { provider: EmailProvider | null | undefined; className?: string }) {
  const p = provider ?? 'IMAP';
  const m = PROVIDER_META[p];
  const letter = p === 'IMAP' ? '@' : m.label[0];
  return (
    <Tooltip content={m.label}>
      <span
        className={cn(
          'inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] border text-[10px] font-semibold',
          HUE_CLASSES[m.hue].bg,
          HUE_CLASSES[m.hue].border,
          HUE_CLASSES[m.hue].text,
          className,
        )}
      >
        {letter}
      </span>
    </Tooltip>
  );
}

/** "Status: A → B" mini transition. */
export function StatusTransition({
  from,
  to,
  className,
}: {
  from: ApplicationStatus | null | undefined;
  to: ApplicationStatus | null | undefined;
  className?: string;
}) {
  if (!to) return null;
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {from && (
        <>
          <StatusBadge status={from} />
          <span className="text-xs text-subtle" aria-label="to">
            →
          </span>
        </>
      )}
      <StatusBadge status={to} />
    </span>
  );
}
