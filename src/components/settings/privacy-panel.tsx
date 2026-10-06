import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Button } from '@/components/ui/button';
import { usePrivacyAction } from '@/hooks/use-queries';
import { SettingsRow } from './settings-section';

type PrivacyKind = 'clearImportedMail' | 'clearDemoData' | 'deleteAllData';

const ACTIONS: {
  kind: PrivacyKind;
  label: string;
  description: string;
  button: string;
  confirmTitle: string;
  confirmDescription: string;
  typeToConfirm?: string;
}[] = [
  {
    kind: 'clearImportedMail',
    label: 'Clear imported mail',
    description: 'Deletes all imported emails and email-derived events. Applications are kept. Sync cursors are reset, so the next sync re-imports mail.',
    button: 'Clear mail…',
    confirmTitle: 'Clear all imported mail?',
    confirmDescription:
      'All imported emails and the events derived from them will be permanently deleted. Applications, notes and your email accounts are kept. Sync cursors are reset.',
  },
  {
    kind: 'clearDemoData',
    label: 'Remove demo data',
    description: 'Deletes the seeded demo applications, emails, companies and the demo mail account.',
    button: 'Remove demo data…',
    confirmTitle: 'Remove demo data?',
    confirmDescription: 'Seeded demo applications, emails, companies and the demo account will be permanently deleted. Your own data is not affected.',
  },
  {
    kind: 'deleteAllData',
    label: 'Delete all data',
    description: 'Deletes everything — applications, emails, companies, notes and notifications — except your login, settings and email accounts.',
    button: 'Delete all data…',
    confirmTitle: 'Delete all data?',
    confirmDescription:
      'This permanently deletes all applications, emails, companies, notes, events and notifications. Your login, settings and connected email accounts are kept. This cannot be undone.',
    typeToConfirm: 'DELETE',
  },
];

function PrivacyActionRow({ action }: { action: (typeof ACTIONS)[number] }) {
  const [open, setOpen] = useState(false);
  const mutation = usePrivacyAction(action.kind);

  return (
    <>
      <SettingsRow label={action.label} description={action.description}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-destructive/35 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setOpen(true)}
        >
          {action.button}
        </Button>
      </SettingsRow>
      <ConfirmDialog
        open={open}
        onOpenChange={(o) => !mutation.isPending && setOpen(o)}
        title={action.confirmTitle}
        description={action.confirmDescription}
        confirmLabel={action.label}
        destructive
        loading={mutation.isPending}
        typeToConfirm={action.typeToConfirm}
        onConfirm={async () => {
          try {
            await mutation.mutateAsync();
            setOpen(false);
          } catch {
            /* toast handled by hook */
          }
        }}
      />
    </>
  );
}

export function PrivacyPanel() {
  return (
    <section className="space-y-2.5">
      <div>
        <h2 className="flex items-center gap-1.5 text-[13px] font-semibold">
          <ShieldAlert className="size-3.5 text-hue-red" />
          Privacy &amp; data
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Irreversible actions. Data is deleted from the ApplyFlow database only — nothing is changed in your mailboxes.</p>
      </div>
      <div className="divide-y divide-hue-red/15 rounded-[10px] border border-hue-red/25 bg-card">
        {ACTIONS.map((a) => (
          <PrivacyActionRow key={a.kind} action={a} />
        ))}
      </div>
    </section>
  );
}
