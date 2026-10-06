import { Link } from 'react-router-dom';
import { ArrowRight, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { useDismissOnboarding, useManualTicks, useOnboarding } from '@/hooks/use-onboarding';
import { setupSteps, shouldPromptOnboarding } from '@/lib/onboarding';
import { cn } from '@/lib/utils';
import { ProgressBar, StepMarker } from './step-marker';

/** Compact checklist at the top of the dashboard while onboarding is unfinished and not dismissed. */
export function GettingStartedCard({ className }: { className?: string }) {
  const onboarding = useOnboarding();
  const [ticks] = useManualTicks();
  const dismiss = useDismissOnboarding();

  if (!shouldPromptOnboarding(onboarding.data)) return null;

  const steps = setupSteps(onboarding.data, ticks);
  const doneCount = steps.filter((s) => s.done).length;
  const currentId = steps.find((s) => !s.done)?.id;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:gap-6">
        <div className="min-w-0 md:w-[260px] md:shrink-0">
          <div className="flex items-center gap-2">
            <ListChecks className="size-3.5 text-muted-foreground" />
            <h3 className="text-[13px] font-semibold">Getting started</h3>
            <span className="ml-auto text-xs tabular-nums text-muted-foreground md:hidden">
              {doneCount} of {steps.length} done
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Connect your mailbox so ApplyFlow can build your pipeline.</p>
          <div className="mt-3 flex items-center gap-2">
            <ProgressBar value={doneCount} max={steps.length} />
            <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground md:inline">
              {doneCount} of {steps.length} done
            </span>
          </div>
        </div>

        <ol className="grid min-w-0 flex-1 grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.id} className="flex min-w-0 items-center gap-2">
              <StepMarker index={i + 1} done={s.done} current={s.id === currentId} size="sm" />
              <span
                className={cn(
                  'truncate text-[13px]',
                  s.done ? 'text-muted-foreground' : s.id === currentId ? 'font-medium' : '',
                )}
              >
                {s.title}
              </span>
            </li>
          ))}
        </ol>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button size="sm" asChild>
            <Link to="/welcome">
              Continue setup <ArrowRight />
            </Link>
          </Button>
          <Tooltip content="Hide this — reopen the guide anytime from the profile menu">
            <Button variant="ghost" size="sm" onClick={() => dismiss.mutate()}>
              Dismiss
            </Button>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
}
