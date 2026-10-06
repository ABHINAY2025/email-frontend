import * as React from 'react';
import { cn } from '@/lib/utils';

export const inputClass =
  'flex h-8 w-full min-w-0 rounded-md border border-input bg-card px-2.5 text-sm text-foreground shadow-none transition-colors duration-150 placeholder:text-subtle hover:border-input/80 focus-visible:border-ring/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive/70 aria-[invalid=true]:focus-visible:ring-destructive/20 file:border-0 file:bg-transparent file:text-sm file:font-medium';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input type={type} className={cn(inputClass, className)} ref={ref} {...props} />
  ),
);
Input.displayName = 'Input';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(inputClass, 'h-auto min-h-[72px] resize-y py-1.5 leading-relaxed', className)}
      ref={ref}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export { Input, Textarea };
