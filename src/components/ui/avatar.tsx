import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn, hashString, initials } from '@/lib/utils';

export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root ref={ref} className={cn('relative flex size-7 shrink-0 overflow-hidden rounded-full', className)} {...props} />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn('flex size-full items-center justify-center rounded-full bg-muted text-xs font-medium', className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

/** Deterministic, muted hues for company monograms (hue angle, works in both themes via HSL + alpha). */
const MONOGRAM_HUES = [212, 234, 258, 284, 330, 4, 22, 38, 150, 170, 190, 200];

const SIZES = {
  xs: 'size-5 text-[9px] rounded-[4px]',
  sm: 'size-6 text-[10px] rounded-[5px]',
  md: 'size-7 text-[11px] rounded-md',
  lg: 'size-9 text-[13px] rounded-lg',
  xl: 'size-12 text-base rounded-[10px]',
} as const;

/** Company monogram square: initials on a subtle tint derived from the hashed name. No external logos. */
export function CompanyAvatar({
  name,
  size = 'md',
  className,
}: {
  name: string | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const label = name?.trim() || '?';
  const hue = MONOGRAM_HUES[hashString(label.toLowerCase()) % MONOGRAM_HUES.length];
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center border font-semibold tracking-tight',
        SIZES[size],
        className,
      )}
      style={{
        backgroundColor: `hsl(${hue} 55% 55% / 0.14)`,
        borderColor: `hsl(${hue} 55% 55% / 0.22)`,
        color: `hsl(${hue} 55% var(--monogram-l))`,
      }}
    >
      {initials(label)}
    </span>
  );
}
