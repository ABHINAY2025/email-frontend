import { ServerCrash, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/kbd';
import { errorMessage } from '@/lib/api';
import { ProductMark } from './product-mark';

export function FullScreenLoader() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <ProductMark />
        <Spinner className="size-4" />
      </div>
    </div>
  );
}

export function BackendUnavailable({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="flex h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-center">
        <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
          <ServerCrash className="size-4" />
        </div>
        <p className="text-[13px] font-medium">Can't reach ApplyFlow</p>
        <p className="mt-1 text-xs text-muted-foreground">{errorMessage(error)}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw /> Try again
        </Button>
      </div>
    </div>
  );
}
