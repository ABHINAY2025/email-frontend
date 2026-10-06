import type * as React from 'react';
import { CheckCircle2, CircleAlert, Sparkles } from 'lucide-react';
import { ClassificationBadge, StatusBadge } from '@/components/common/badges';
import { Confidence } from '@/components/common/data-display';
import { useSettings } from '@/hooks/use-queries';
import { cn } from '@/lib/utils';
import type { EmailDetail } from '@/types/api';

/** SUMMARY / ACTION / STATUS IMPACT / CONFIDENCE panel derived from the classifier output. */
export function EmailInsights({ email, className }: { email: EmailDetail; className?: string }) {
  const settings = useSettings();
  const threshold = settings.data?.confidenceThreshold ?? 0.75;
  const impact = email.statusImpact;

  return (
    <div className={cn('overflow-hidden rounded-lg border', className)}>
      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Block label="Summary" icon={<Sparkles className="size-3 text-primary" />}>
          {email.summary ? <p className="text-[13px] leading-snug">{email.summary}</p> : <Muted>No summary available</Muted>}
        </Block>
        <Block label="Action">
          {email.actionText ? (
            <p className={cn('text-[13px] leading-snug', email.actionRequired && 'font-medium text-hue-amber')}>{email.actionText}</p>
          ) : (
            <Muted>{email.actionRequired ? 'Action required' : 'No action required.'}</Muted>
          )}
        </Block>
        <Block label="Status impact">
          {impact ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1">
                {impact.from && (
                  <>
                    <StatusBadge status={impact.from} />
                    <span className="text-xs text-subtle">→</span>
                  </>
                )}
                <StatusBadge status={impact.to} />
              </div>
              {impact.applied ? (
                <span className="inline-flex items-center gap-1 text-xs text-hue-green">
                  <CheckCircle2 className="size-3" /> Applied automatically
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-hue-orange">
                  <CircleAlert className="size-3" /> Needs review
                </span>
              )}
            </div>
          ) : email.detectedStatus ? (
            <div className="space-y-1.5">
              <StatusBadge status={email.detectedStatus} />
              <Muted>Detected status — no change</Muted>
            </div>
          ) : (
            <Muted>No status change</Muted>
          )}
        </Block>
        <Block label="Confidence">
          <div className="flex flex-wrap items-center gap-2">
            <Confidence value={email.confidence} threshold={threshold} />
            <ClassificationBadge value={email.classification} />
          </div>
          {email.confidence < threshold && (
            <p className="mt-1.5 text-2xs text-subtle">Below your {Math.round(threshold * 100)}% auto-update threshold.</p>
          )}
        </Block>
      </div>
      {email.classificationReason && (
        <div className="border-t bg-elevated px-3 py-2 text-xs text-muted-foreground">
          <span className="label-caps mr-2">Reason</span>
          {email.classificationReason}
        </div>
      )}
    </div>
  );
}

function Block({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-0 bg-elevated px-3 py-2.5">
      <div className="label-caps mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-xs italic text-subtle">{children}</p>;
}
