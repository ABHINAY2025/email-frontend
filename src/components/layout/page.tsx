import type * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Standard page container with consistent gutters. */
export function Page({ children, className, wide }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className={cn('mx-auto w-full px-4 py-5 md:px-6 lg:px-8', wide ? 'max-w-none' : 'max-w-[1440px]', className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  meta,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className={cn('mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        {meta}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <Page>
      <Skeleton className="mb-2 h-6 w-48" />
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-4 h-80 rounded-xl" />
    </Page>
  );
}
