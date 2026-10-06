import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Command,
  ExternalLink,
  Info,
  Plug,
  RefreshCw,
  SquareKanban,
} from 'lucide-react';
import { ErrorNote } from '@/components/common/states';
import { Page } from '@/components/layout/page';
import { ProgressBar, StepMarker } from '@/components/onboarding/step-marker';
import { ConnectAccountDialog } from '@/components/settings/connect-account-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Kbd, Spinner } from '@/components/ui/kbd';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import {
  useDismissOnboarding,
  useManualTicks,
  useOnboardingStatusWithFallback,
} from '@/hooks/use-onboarding';
import { useDashboardSummary, useEmailAccounts, useSettings, useStartSync, useSyncStatus } from '@/hooks/use-queries';
import { firstName } from '@/lib/format';
import { GOOGLE_2SV_URL, GOOGLE_APP_PASSWORDS_URL, setupSteps, type SetupStepId } from '@/lib/onboarding';
import { cn, pluralize } from '@/lib/utils';
import type { OnboardingStatus } from '@/types/api';

type StepId = SetupStepId | 'review';

export default function WelcomePage() {
  const { user } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const { status, isLoading } = useOnboardingStatusWithFallback();
  const [ticks, setTicks] = useManualTicks();
  const dismiss = useDismissOnboarding();
  const [connectOpen, setConnectOpen] = useState(false);

  const steps = setupSteps(status, ticks);
  const doneCount = steps.filter((s) => s.done).length;
  const currentId: StepId = steps.find((s) => !s.done)?.id ?? 'review';

  // Which step is expanded: follows the current step until the user opens another one;
  // snaps back to the current step whenever progress is made.
  const [openId, setOpenId] = useState<StepId | null | undefined>(undefined);
  useEffect(() => setOpenId(undefined), [currentId]);
  const expandedId = openId === undefined ? currentId : openId;
  const toggle = (id: StepId) => setOpenId(expandedId === id ? null : id);

  const leave = () => {
    dismiss.mutate();
    navigate('/dashboard');
  };

  const name = firstName(settings.data?.displayName || user?.displayName || user?.username);
  const connected = !!status?.hasEmailAccount;

  const stepProps = (id: StepId, index: number) => ({
    id,
    index,
    done: id === 'review' ? false : !!steps.find((s) => s.id === id)?.done,
    current: id === currentId,
    expanded: expandedId === id,
    onToggle: () => toggle(id),
    last: id === 'review',
  });

  return (
    <Page className="max-w-[860px]">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Setup guide</p>
          <h1 className="mt-0.5 text-lg font-semibold tracking-tight">Welcome to ApplyFlow{name ? `, ${name}` : ''}</h1>
          <p className="mt-0.5 max-w-xl text-[13px] text-muted-foreground">
            Connect your mailbox and ApplyFlow builds your application tracker for you. Setup takes about three minutes.
          </p>
        </div>
        <div className="w-full shrink-0 sm:w-48">
          <div className="mb-1.5 flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium tabular-nums">
              {isLoading ? '–' : `${doneCount} of ${steps.length} done`}
            </span>
          </div>
          <ProgressBar value={isLoading ? 0 : doneCount} max={steps.length} />
        </div>
      </div>

      <Card className="px-4 py-5 sm:px-6">
        {isLoading ? (
          <StepsSkeleton />
        ) : (
          <ol>
            <Step {...stepProps('twoStep', 1)} title="Turn on 2-Step Verification for your Google account">
              <p>
                Google only lets you create app passwords once 2-Step Verification is on. If it's already enabled, just tick the
                box below.
              </p>
              <StepActions>
                <ExternalButton href={GOOGLE_2SV_URL}>Open Google security settings</ExternalButton>
                {!connected && (
                  <ManualTick id="tick-2sv" checked={ticks.twoStep} onChange={(v) => setTicks({ twoStep: v })} />
                )}
              </StepActions>
            </Step>

            <Step {...stepProps('appPassword', 2)} title="Create an App Password">
              <p>
                Create a new app password, name it <span className="font-medium text-foreground">ApplyFlow</span>, and copy the
                16-character password Google shows you. You'll paste it in the next step. Google shows it only once.
              </p>
              <StepActions>
                <ExternalButton href={GOOGLE_APP_PASSWORDS_URL}>Open App Passwords</ExternalButton>
                {!connected && (
                  <ManualTick id="tick-apppw" checked={ticks.appPassword} onChange={(v) => setTicks({ appPassword: v })} />
                )}
              </StepActions>
              <p className="mt-3 flex items-start gap-1.5 text-xs">
                <Info className="mt-px size-3.5 shrink-0" />
                <span>
                  Using Outlook, Yahoo or iCloud? They also require an app password, created in your account's security settings.
                  You can choose your provider in the next step.
                </span>
              </p>
            </Step>

            <Step {...stepProps('connect', 3)} title="Connect your mailbox">
              <ConnectStep connected={connected} onConnect={() => setConnectOpen(true)} />
            </Step>

            <Step {...stepProps('firstSync', 4)} title="First sync">
              <FirstSyncStep status={status} />
            </Step>

            <Step {...stepProps('review', 5)} title="Review your applications">
              <ReviewStep />
            </Step>
          </ol>
        )}
      </Card>

      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-subtle">You can reopen this guide anytime from the profile menu.</p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={leave}>
            Skip for now
          </Button>
          {status?.completed && (
            <Button onClick={leave}>
              Finish <ArrowRight />
            </Button>
          )}
        </div>
      </div>

      <ConnectAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </Page>
  );
}

// ---------------------------------------------------------------- step shell

function Step({
  id,
  index,
  title,
  done,
  current,
  expanded,
  onToggle,
  last,
  children,
}: {
  id: StepId;
  index: number;
  title: string;
  done: boolean;
  current: boolean;
  expanded: boolean;
  onToggle: () => void;
  last?: boolean;
  children: ReactNode;
}) {
  const panelId = `step-${id}`;
  return (
    <li className={cn('relative flex gap-3.5', !last && 'pb-5')}>
      {!last && <span aria-hidden className={cn('absolute bottom-0 left-[11.5px] top-7 w-px', done ? 'bg-hue-green/30' : 'bg-border')} />}
      <StepMarker index={index} done={done} current={current} />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="group flex min-h-6 w-full items-center gap-2 rounded-sm text-left focus-ring"
        >
          <span
            className={cn(
              'min-w-0 flex-1 text-[13px]',
              current ? 'font-semibold text-foreground' : done ? 'font-medium text-muted-foreground' : 'font-medium text-foreground/90',
            )}
          >
            {title}
          </span>
          {done && <span className="shrink-0 text-xs text-hue-green">Done</span>}
          {current && !done && <span className="shrink-0 text-xs font-medium text-primary">Up next</span>}
          <ChevronDown
            className={cn('size-3.5 shrink-0 text-subtle transition-transform duration-150 group-hover:text-muted-foreground', expanded && 'rotate-180')}
          />
        </button>
        {expanded && (
          <div
            id={panelId}
            className={cn(
              'mt-2.5 rounded-lg border px-3.5 py-3 text-[13px] leading-relaxed text-muted-foreground',
              current ? 'border-primary/25 bg-primary/[0.035]' : 'bg-muted/30',
            )}
          >
            {children}
          </div>
        )}
      </div>
    </li>
  );
}

function StepActions({ children }: { children: ReactNode }) {
  return <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">{children}</div>;
}

function ExternalButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button size="sm" variant="outline" asChild>
      <a href={href} target="_blank" rel="noreferrer noopener">
        {children} <ExternalLink />
      </a>
    </Button>
  );
}

function ManualTick({ id, checked, onChange }: { id: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-foreground">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      I've done this
    </label>
  );
}

function StepsSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3.5">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-4 w-64" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- step bodies

function ConnectStep({ connected, onConnect }: { connected: boolean; onConnect: () => void }) {
  const accounts = useEmailAccounts();
  const real = (accounts.data ?? []).filter((a) => a.provider !== 'DEMO');
  return (
    <>
      <p>
        Enter your email address and the app password. ApplyFlow tests the connection first, reads your mailbox over IMAP
        (read-only), and stores the password encrypted.
      </p>
      {connected && real.length > 0 && (
        <ul className="mt-3 space-y-1">
          {real.map((a) => (
            <li key={a.id} className="flex items-center gap-1.5 text-foreground">
              <CheckCircle2 className="size-3.5 text-hue-green" />
              <span className="truncate">{a.email}</span>
            </li>
          ))}
        </ul>
      )}
      <StepActions>
        <Button size="sm" variant={connected ? 'outline' : 'default'} onClick={onConnect}>
          <Plug /> {connected ? 'Connect another mailbox' : 'Connect mailbox'}
        </Button>
        {connected && (
          <Link to="/settings/email-accounts" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
            Manage email accounts
          </Link>
        )}
      </StepActions>
    </>
  );
}

function FirstSyncStep({ status }: { status: OnboardingStatus | null }) {
  const settings = useSettings();
  const sync = useSyncStatus();
  const startSync = useStartSync();
  const accounts = useEmailAccounts();
  const summary = useDashboardSummary();

  const windowDays = settings.data?.defaultInitialSyncDays ?? 90;
  const windowLabel = windowDays === 0 ? 'all available mail' : `the last ${windowDays} days`;
  const connected = !!status?.hasEmailAccount;
  const syncing = !!status?.syncInProgress || sync.data?.state === 'SYNCING' || startSync.isPending;
  const running = (sync.data?.recentJobs ?? []).filter((j) => j.status === 'RUNNING');
  const processed = running.reduce((n, j) => n + j.messagesProcessed, 0);
  const fetched = running.reduce((n, j) => n + j.messagesFetched, 0);
  const foundNow = running.reduce((n, j) => n + j.jobEmailsFound, 0);
  const jobEmails = (accounts.data ?? []).filter((a) => a.provider !== 'DEMO').reduce((n, a) => n + a.jobEmails, 0);
  const apps = summary.data?.total ?? 0;
  const failed = !syncing && !status?.firstSyncCompleted && sync.data?.state === 'ERROR';

  return (
    <>
      <p>
        ApplyFlow scans {windowLabel} (you can change this per account) and imports only job-related emails: confirmations,
        recruiter messages, interviews, offers and rejections. Everything else is skipped and never stored.
      </p>

      {syncing ? (
        <div className="mt-3 flex items-center gap-2 text-foreground" role="status" aria-live="polite">
          <Spinner className="size-4 text-primary" />
          <span className="font-medium">Scanning your mailbox…</span>
          {fetched > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {processed.toLocaleString()} of {fetched.toLocaleString()} messages checked
              {foundNow > 0 ? ` · ${pluralize(foundNow, 'job email')} so far` : ''}
            </span>
          )}
        </div>
      ) : status?.firstSyncCompleted ? (
        <div className="mt-3 flex items-center gap-2 text-foreground" role="status">
          <CheckCircle2 className="size-4 text-hue-green" />
          <span className="font-medium tabular-nums">
            Found {pluralize(jobEmails, 'job email')} · {pluralize(apps, 'application')}
          </span>
        </div>
      ) : failed ? (
        <ErrorNote className="mt-3">
          <p className="font-medium text-foreground">The last sync failed</p>
          {sync.data?.lastError && <p className="mt-0.5 text-muted-foreground">{sync.data.lastError}</p>}
          <Link to="/settings/email-accounts" className="mt-1 inline-block font-medium text-primary underline-offset-4 hover:underline">
            Check your email account
          </Link>
        </ErrorNote>
      ) : !connected ? (
        <p className="mt-3 text-xs text-subtle">Connect a mailbox first. The first sync starts automatically.</p>
      ) : null}

      {connected && !syncing && (
        <StepActions>
          <Button size="sm" variant={status?.firstSyncCompleted ? 'outline' : 'default'} onClick={() => startSync.mutate()}>
            <RefreshCw /> Sync now
          </Button>
        </StepActions>
      )}
    </>
  );
}

function ReviewStep() {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  return (
    <>
      <p>Your pipeline fills in automatically as new emails arrive. A few things worth knowing:</p>
      <ul className="mt-2.5 space-y-2">
        <TourItem icon={SquareKanban}>
          Drag cards on the{' '}
          <Link to="/kanban" className="font-medium text-foreground underline-offset-4 hover:underline">
            Kanban board
          </Link>{' '}
          to change an application's status.
        </TourItem>
        <TourItem icon={Command}>
          Press{' '}
          <span className="inline-flex translate-y-[-1px] items-center gap-0.5 align-middle">
            <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
            <Kbd>K</Kbd>
          </span>{' '}
          to open the command palette and jump to any application, email or company.
        </TourItem>
        <TourItem icon={CalendarDays}>
          Interviews, assessments and deadlines appear on the{' '}
          <Link to="/calendar" className="font-medium text-foreground underline-offset-4 hover:underline">
            calendar
          </Link>{' '}
          automatically.
        </TourItem>
      </ul>
      <StepActions>
        <Button size="sm" asChild>
          <Link to="/dashboard">Go to dashboard</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to="/inbox?tab=review">Review possible matches</Link>
        </Button>
      </StepActions>
    </>
  );
}

function TourItem({ icon: Icon, children }: { icon: ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="mt-[3px] size-3.5 shrink-0 text-muted-foreground" />
      <span>{children}</span>
    </li>
  );
}
