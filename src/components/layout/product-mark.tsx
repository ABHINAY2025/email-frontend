import { cn } from '@/lib/utils';

export function ProductLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-5', className)} aria-hidden>
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <path d="M9 22 15 9h2l6 13h-3l-1.3-3h-5.4L12 22H9Zm5.3-5.6h3.4L16 12.3l-1.7 4.1Z" fill="#fff" />
    </svg>
  );
}

export function ProductMark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <ProductLogo />
      {!compact && <span className="text-[14px] font-semibold tracking-tight">ApplyFlow</span>}
    </span>
  );
}
