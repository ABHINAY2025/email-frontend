import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  /** If set, the user must type this exact text to enable confirm. */
  typeToConfirm?: string;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  destructive,
  loading,
  typeToConfirm,
  onConfirm,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);
  const blocked = !!typeToConfirm && typed.trim() !== typeToConfirm;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {(children || typeToConfirm) && (
          <DialogBody className="space-y-3">
            {children}
            {typeToConfirm && (
              <div className="space-y-1.5">
                <Label htmlFor="type-confirm">
                  Type <span className="font-mono font-semibold text-foreground">{typeToConfirm}</span> to confirm
                </Label>
                <Input
                  id="type-confirm"
                  autoComplete="off"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !blocked) void onConfirm();
                  }}
                />
              </div>
            )}
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            loading={loading}
            disabled={blocked}
            onClick={() => void onConfirm()}
            autoFocus={!typeToConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
