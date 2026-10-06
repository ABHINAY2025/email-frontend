import { forwardRef, useState } from 'react';
import { Pencil, StickyNote, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { RelativeTime } from '@/components/common/data-display';
import { EmptyState } from '@/components/common/states';
import { useAddNote, useDeleteNote, useUpdateNote } from '@/hooks/use-applications';
import type { Note } from '@/types/api';

export const NotesSection = forwardRef<HTMLTextAreaElement, { applicationId: number; notes: Note[] }>(function NotesSection(
  { applicationId, notes },
  ref,
) {
  const [draft, setDraft] = useState('');
  const add = useAddNote(applicationId);
  const sorted = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const submit = () => {
    const content = draft.trim();
    if (!content) return;
    add.mutate(content, { onSuccess: () => setDraft('') });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card focus-within:border-ring/60">
        <Textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Add a note — interview prep, contacts, salary discussions…"
          className="min-h-[80px] border-0 bg-transparent focus-visible:ring-0"
          aria-label="New note"
        />
        <div className="flex items-center justify-between border-t px-2 py-1.5">
          <span className="hidden items-center gap-1 text-2xs text-subtle sm:inline-flex">
            <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> to save
          </span>
          <Button size="sm" onClick={submit} disabled={!draft.trim()} loading={add.isPending} className="ml-auto">
            Add note
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState compact icon={StickyNote} title="No notes yet" description="Notes are private to you and independent of emails." />
      ) : (
        <ul className="space-y-2">
          {sorted.map((n) => (
            <NoteItem key={n.id} note={n} applicationId={applicationId} />
          ))}
        </ul>
      )}
    </div>
  );
});

function NoteItem({ note, applicationId }: { note: Note; applicationId: number }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(note.content);
  const [confirm, setConfirm] = useState(false);
  const update = useUpdateNote(applicationId);
  const del = useDeleteNote(applicationId);
  const edited = note.updatedAt && note.updatedAt !== note.createdAt;

  const save = () => {
    const content = value.trim();
    if (!content || content === note.content) return setEditing(false);
    update.mutate({ noteId: note.id, content }, { onSuccess: () => setEditing(false) });
  };

  return (
    <li className="group rounded-lg border bg-card px-3 py-2.5">
      <div className="mb-1 flex items-center gap-2 text-2xs text-subtle">
        <RelativeTime value={note.createdAt} />
        {edited && <span>· edited <RelativeTime value={note.updatedAt} /></span>}
        {!editing && (
          <div className="ml-auto flex gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                setValue(note.content);
                setEditing(true);
              }}
              aria-label="Edit note"
            >
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => setConfirm(true)} aria-label="Delete note">
              <Trash2 />
            </Button>
          </div>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={save} loading={update.isPending}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{note.content}</p>
      )}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete note?"
        description="This note will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setConfirm(false);
          del.mutate(note.id);
        }}
      />
    </li>
  );
}
