import type * as React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  className,
  compact,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', compact ? 'py-8' : 'py-16', className)}>
      {Icon && (
        <div className="mb-3 flex size-9 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      )}
      <p className="text-[13px] font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>}
      {actions && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = 'Could not load this data',
  className,
  compact,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', compact ? 'py-6' : 'py-14', className)} role="alert">
      <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-hue-red/25 bg-hue-red/10 text-hue-red">
        <AlertTriangle className="size-4" />
      </div>
      <p className="text-[13px] font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw /> Retry
        </Button>
      )}
    </div>
  );
}

/** Inline muted red notice box. */
export function ErrorNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-2 rounded-md border border-hue-red/20 bg-hue-red/[0.07] px-2.5 py-2 text-xs text-hue-red', className)}>
      <AlertTriangle className="mt-px size-3.5 shrink-0" />
      <div className="min-w-0 break-words text-foreground/85">{children}</div>
    </div>
  );
}
