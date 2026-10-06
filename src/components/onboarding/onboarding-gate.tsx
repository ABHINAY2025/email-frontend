import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSkeleton } from '@/components/layout/page';
import { useAuth } from '@/hooks/use-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { markGuideAutoShown, shouldPromptOnboarding, wasGuideAutoShown } from '@/lib/onboarding';

/**
 * Wraps the dashboard route. The first time per browser session that a user with unfinished,
 * undismissed onboarding lands here, they are sent to /welcome once. Never loops: the session
 * flag is set as soon as the status is known, and an unavailable endpoint simply renders the page.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const onboarding = useOnboarding();
  const alreadyEvaluated = wasGuideAutoShown(user);
  const prompt = !alreadyEvaluated && shouldPromptOnboarding(onboarding.data);
  const settled = onboarding.isSuccess || onboarding.isError;

  useEffect(() => {
    if (alreadyEvaluated || !settled) return;
    markGuideAutoShown(user);
    if (prompt) navigate('/welcome', { replace: true });
  }, [alreadyEvaluated, settled, prompt, user, navigate]);

  if (prompt || (!alreadyEvaluated && onboarding.isLoading)) return <PageSkeleton />;
  return <>{children}</>;
}
