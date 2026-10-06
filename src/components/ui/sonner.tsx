import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/lib/theme';

export function Toaster() {
  const { resolved } = useTheme();
  return (
    <Sonner
      theme={resolved}
      position="bottom-right"
      closeButton
      gap={8}
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast:
            'group !rounded-lg !border !border-border !bg-popover !text-popover-foreground !shadow-popover !text-[13px] !py-3 !px-3.5 !gap-2.5',
          title: '!font-medium !text-[13px]',
          description: '!text-xs !text-muted-foreground',
          actionButton: '!h-6 !rounded-md !bg-primary !px-2 !text-xs !font-medium !text-primary-foreground',
          cancelButton: '!h-6 !rounded-md !bg-secondary !px-2 !text-xs',
          closeButton: '!border-border !bg-popover !text-muted-foreground hover:!text-foreground',
          icon: '!size-4',
        },
      }}
    />
  );
}
