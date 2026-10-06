import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn('flex items-center gap-1 border-b', className)} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative -mb-px inline-flex h-9 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-foreground [&_svg]:size-3.5',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn('focus-visible:outline-none', className)} {...props} />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

/** Segmented control (pill toggle group) built on Tabs semantics. */
export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  className,
  size = 'default',
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; title?: string }[];
  className?: string;
  size?: 'default' | 'sm';
}) {
  return (
    <div role="radiogroup" className={cn('inline-flex items-center rounded-md border bg-muted/60 p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onValueChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[5px] px-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              size === 'sm' ? 'h-6 text-xs' : 'h-7 text-xs',
              active ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
