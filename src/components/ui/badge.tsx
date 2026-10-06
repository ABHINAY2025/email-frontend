import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { HUE_CLASSES, type HueName } from '@/lib/status';

const badgeVariants = cva(
  'inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-[5px] border px-1.5 text-xs font-medium leading-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary',
        secondary: 'border-border bg-secondary text-secondary-foreground',
        outline: 'border-border text-muted-foreground',
        destructive: 'border-transparent bg-destructive/12 text-destructive',
      },
    },
    defaultVariants: { variant: 'secondary' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Subtle tinted badge with a colored dot — never a saturated fill. */
export function HueBadge({
  hue,
  children,
  className,
  dot = true,
  icon: Icon,
  title,
}: {
  hue: HueName;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
}) {
  const c = HUE_CLASSES[hue];
  return (
    <span
      title={title}
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[5px] border px-1.5 text-xs font-medium leading-none',
        c.bg,
        c.border,
        c.text,
        className,
      )}
    >
      {Icon ? <Icon className="size-3" /> : dot ? <span className={cn('size-1.5 rounded-full', c.dot)} /> : null}
      <span className="text-foreground/90 dark:text-foreground/85">{children}</span>
    </span>
  );
}

export { badgeVariants };
