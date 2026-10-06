import { useNavigate } from 'react-router-dom';
import { EyeOff, GitMerge, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompanyAvatar } from '@/components/ui/avatar';
import { Tooltip } from '@/components/ui/tooltip';
import { useCreateApplicationFromEmail, useIgnoreEmail, useMergeEmail } from '@/hooks/use-inbox';
import type { EmailDetail } from '@/types/api';

/** "Possible application match" review panel for needsReview emails. */
export function MatchReview({ email, onDone }: { email: EmailDetail; onDone?: () => void }) {
  const merge = useMergeEmail();
  const create = useCreateApplicationFromEmail();
  const ignore = useIgnoreEmail();
  const navigate = useNavigate();
  const busy = merge.isPending || create.isPending || ignore.isPending;
  const suggestions = [...email.matchSuggestions].sort((a, b) => b.score - a.score);

  return (
    <section className="overflow-hidden rounded-lg border border-hue-orange/30">
      <div className="flex items-center gap-2 border-b border-hue-orange/20 bg-hue-orange/[0.07] px-3 py-2">
        <Sparkles className="size-3.5 text-hue-orange" />
        <h3 className="text-[13px] font-semibold">{suggestions.length ? 'Possible application match' : 'Needs review'}</h3>
        <span className="text-xs text-muted-foreground">
          {suggestions.length ? '— is this email about one of these applications?' : '— confirm what this email belongs to.'}
        </span>
      </div>
      {suggestions.length > 0 && (
        <ul className="divide-y">
          {suggestions.map((s) => (
            <li key={s.applicationId} className="flex items-center gap-3 px-3 py-2.5">
              <CompanyAvatar name={s.companyName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">
                  {s.companyName} <span className="font-normal text-muted-foreground">· {s.jobTitle}</span>
                </p>
                <p className="truncate text-xs text-subtle">{s.reason}</p>
              </div>
              <Tooltip content="Match score">
                <span className="tabular inline-flex items-center gap-1.5 text-xs">
                  <span className="relative h-1 w-10 overflow-hidden rounded-full bg-muted">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-hue-orange" style={{ width: `${Math.round(s.score * 100)}%` }} />
                  </span>
                  {Math.round(s.score * 100)}%
                </span>
              </Tooltip>
              <Button
                size="xs"
                variant="outline"
                disabled={busy}
                loading={merge.isPending && merge.variables?.applicationId === s.applicationId}
                onClick={() => merge.mutate({ id: email.id, applicationId: s.applicationId })}
              >
                <GitMerge /> Merge
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2 border-t bg-elevated/50 px-3 py-2">
        <Button
          size="xs"
          disabled={busy}
          loading={create.isPending}
          onClick={() => create.mutate(email.id, { onSuccess: (app) => navigate(`/applications/${app.id}`) })}
        >
          <Plus /> Create new application
        </Button>
        <Button size="xs" variant="ghost" disabled={busy} loading={ignore.isPending} onClick={() => ignore.mutate(email.id, { onSuccess: () => onDone?.() })}>
          <EyeOff /> Ignore — not job related
        </Button>
      </div>
    </section>
  );
}
