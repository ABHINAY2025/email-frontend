import type * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductLogo } from '@/components/layout/product-mark';
import { useTheme } from '@/lib/theme';

/** Centered card layout shared by the public auth pages (/login, /register). */
export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { resolved, toggle } = useTheme();
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <Button variant="ghost" size="icon-sm" className="absolute right-4 top-4" onClick={toggle} aria-label="Toggle theme">
        {resolved === 'dark' ? <Sun className="!size-4" /> : <Moon className="!size-4" />}
      </Button>

      <div className="w-full max-w-[360px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <ProductLogo className="mb-4 size-9" />
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
        </div>
        {children}
        {footer && <div className="mt-4 text-center text-[13px] text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}
