import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Pagination({
  page,
  size,
  totalElements,
  totalPages,
  onPageChange,
  className,
}: {
  /** 0-based */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalElements === 0) return null;
  const start = page * size + 1;
  const end = Math.min(totalElements, (page + 1) * size);
  return (
    <div className={cn('flex items-center justify-between gap-3 text-xs text-muted-foreground', className)}>
      <span className="tabular">
        {start.toLocaleString()}–{end.toLocaleString()} of {totalElements.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <span className="tabular mr-2 hidden sm:inline">
          Page {page + 1} of {Math.max(1, totalPages)}
        </span>
        <Button variant="outline" size="icon-sm" disabled={page <= 0} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
