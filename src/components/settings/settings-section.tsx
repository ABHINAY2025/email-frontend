import type * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Section heading + bordered panel (rows separated by 1px dividers). */
export function SettingsSection({
  title,
  description,
  actions,
  children,
  className,
  panelClassName,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
}) {
  return (
    <section className={cn('space-y-2.5', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <SettingsPanel className={panelClassName}>{children}</SettingsPanel>
    </section>
  );
}

export function SettingsPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('divide-y rounded-[10px] border bg-card', className)}>{children}</div>;
}

/** Left: label + description (+ error). Right: control. Stacks on mobile. */
export function SettingsRow({
  label,
  description,
  htmlFor,
  error,
  children,
  className,
  controlClassName,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  controlClassName?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8', className)}>
      <div className="min-w-0 sm:max-w-[60%]">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-[13px] font-medium">
            {label}
          </label>
        ) : (
          <div className="text-[13px] font-medium">{label}</div>
        )}
        {description && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>}
        {error && (
          <p className="mt-1 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className={cn('flex shrink-0 items-center sm:justify-end', controlClassName)}>{children}</div>
    </div>
  );
}

export function SettingsRowSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <SettingsPanel>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-8 px-4 py-3.5">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-8 w-40" />
        </div>
      ))}
    </SettingsPanel>
  );
}
