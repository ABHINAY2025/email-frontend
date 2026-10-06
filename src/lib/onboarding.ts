import type { CurrentUser, OnboardingStatus } from '@/types/api';

const AUTO_SHOWN_PREFIX = 'applyflow.onboarding.autoShown:';
const TICKS_PREFIX = 'applyflow.onboarding.ticks:';

export const GOOGLE_2SV_URL = 'https://myaccount.google.com/signinoptions/twosv';
export const GOOGLE_APP_PASSWORDS_URL = 'https://myaccount.google.com/apppasswords';

function userKey(user: CurrentUser | null | undefined): string {
  return (user?.email || user?.username || 'anonymous').toLowerCase();
}

// ------------------------------------------------------------- once-per-session auto redirect
export function wasGuideAutoShown(user: CurrentUser | null | undefined): boolean {
  try {
    return sessionStorage.getItem(AUTO_SHOWN_PREFIX + userKey(user)) === '1';
  } catch {
    return true; // storage blocked → never auto-redirect (avoids loops)
  }
}

export function markGuideAutoShown(user: CurrentUser | null | undefined) {
  try {
    sessionStorage.setItem(AUTO_SHOWN_PREFIX + userKey(user), '1');
  } catch {
    /* ignore */
  }
}

export function clearOnboardingSessionFlags() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(AUTO_SHOWN_PREFIX)) sessionStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------- manual "I've done this" ticks
export interface ManualTicks {
  twoStep: boolean;
  appPassword: boolean;
}

export function readTicks(user: CurrentUser | null | undefined): ManualTicks {
  try {
    const raw = localStorage.getItem(TICKS_PREFIX + userKey(user));
    const v = raw ? (JSON.parse(raw) as Partial<ManualTicks>) : {};
    return { twoStep: !!v.twoStep, appPassword: !!v.appPassword };
  } catch {
    return { twoStep: false, appPassword: false };
  }
}

export function writeTicks(user: CurrentUser | null | undefined, ticks: ManualTicks) {
  try {
    localStorage.setItem(TICKS_PREFIX + userKey(user), JSON.stringify(ticks));
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------- steps
export type SetupStepId = 'twoStep' | 'appPassword' | 'connect' | 'firstSync';

export interface SetupStep {
  id: SetupStepId;
  title: string;
  done: boolean;
}

/** The four trackable setup steps (the final "review" step is not counted). */
export function setupSteps(status: OnboardingStatus | null | undefined, ticks: ManualTicks): SetupStep[] {
  const connected = !!status?.hasEmailAccount;
  return [
    { id: 'twoStep', title: 'Turn on 2-Step Verification', done: ticks.twoStep || connected },
    { id: 'appPassword', title: 'Create an App Password', done: ticks.appPassword || connected },
    { id: 'connect', title: 'Connect your mailbox', done: connected },
    { id: 'firstSync', title: 'Run your first sync', done: !!status?.firstSyncCompleted },
  ];
}

/** Whether the guide should be pushed at the user (auto redirect / dashboard card). */
export function shouldPromptOnboarding(status: OnboardingStatus | null | undefined): boolean {
  return !!status && !status.completed && !status.dismissed;
}
