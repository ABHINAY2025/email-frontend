import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-xl border bg-card text-card-foreground', className)} {...props} />
));
Card.displayName = 'Card';

export function CardHeader({
  title,
  description,
  actions,
  className,
  icon: Icon,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={cn('flex min-h-11 items-center justify-between gap-3 border-b px-4 py-2', className)}>
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold">{title}</h3>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}
