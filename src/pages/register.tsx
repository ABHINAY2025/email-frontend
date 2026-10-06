import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common/form-field';
import { ErrorNote } from '@/components/common/states';
import { AuthScreen } from '@/components/auth/auth-screen';
import { FullScreenLoader } from '@/components/layout/boot';
import { PasswordInput } from '@/components/settings/account-form';
import { applyFieldErrors } from '@/components/settings/form-errors';
import { useAuth } from '@/hooks/use-auth';
import { useAuthConfig } from '@/hooks/use-onboarding';
import { ApiClientError, errorMessage } from '@/lib/api';
import { markGuideAutoShown } from '@/lib/onboarding';

const schema = z
  .object({
    displayName: z.string().trim().min(1, 'Enter your name').max(80, 'Use at most 80 characters'),
    email: z.string().trim().min(1, 'Email is required').max(254, 'Email is too long').email('Enter a valid email address'),
    password: z.string().min(8, 'Use at least 8 characters').max(128, 'Use at most 128 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
type Values = z.infer<typeof schema>;

const SERVER_FIELDS = ['displayName', 'email', 'password'] as const;

const linkClass = 'font-medium text-primary underline-offset-4 hover:underline focus-ring rounded-sm';

export default function RegisterPage() {
  const { user, isLoading, register: registerAccount } = useAuth();
  const config = useAuthConfig();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);
  const justRegistered = useRef(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  });
  const { register, handleSubmit, formState, setError: setFieldError } = form;
  const err = formState.errors;

  if (isLoading || config.isPending) return <FullScreenLoader />;
  // Registering sets the user before our navigate('/welcome') runs; don't let this redirect win that race.
  if (user) return <Navigate to={justRegistered.current ? '/welcome' : '/dashboard'} replace />;

  const signInFooter = (
    <>
      Already have an account?{' '}
      <Link to="/login" className={linkClass}>
        Sign in
      </Link>
    </>
  );

  if (disabled || !config.data?.registrationEnabled) {
    return (
      <AuthScreen title="Create your account" subtitle="Your job applications, tracked from your inbox." footer={signInFooter}>
        <div className="rounded-xl border bg-card p-5">
          <ErrorNote>
            <p className="font-medium text-foreground">Registration is disabled</p>
            <p className="mt-0.5 text-muted-foreground">New accounts can't be created on this server. Ask the owner for access.</p>
          </ErrorNote>
        </div>
      </AuthScreen>
    );
  }

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    justRegistered.current = true;
    try {
      const created = await registerAccount({
        displayName: v.displayName.trim(),
        email: v.email.trim(),
        password: v.password,
      });
      // The guide opens right away — don't auto-redirect to it again this session.
      markGuideAutoShown(created);
      navigate('/welcome', { replace: true });
    } catch (e) {
      justRegistered.current = false;
      form.resetField('password');
      form.resetField('confirmPassword');
      if (e instanceof ApiClientError && e.status === 409) {
        setFieldError('email', { type: 'server', message: 'An account with this email already exists.' });
        return;
      }
      // Only the backend's explicit code means "disabled"; any other 403 (e.g. a CORS rejection) is a generic error.
      if (e instanceof ApiClientError && e.code === 'REGISTRATION_DISABLED') {
        setDisabled(true);
        return;
      }
      if (e instanceof ApiClientError && e.status === 429) {
        setError('Too many sign-up attempts from this network. Please try again later.');
        return;
      }
      const mapped = applyFieldErrors(e, SERVER_FIELDS, setFieldError);
      if (!mapped) setError(errorMessage(e, 'Could not create your account. Please try again.'));
    }
  });

  return (
    <AuthScreen title="Create your account" subtitle="Track every application straight from your inbox." footer={signInFooter}>
      <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-xl border bg-card p-5">
        {error && <ErrorNote>{error}</ErrorNote>}
        <FormField label="Display name" htmlFor="displayName" error={err.displayName?.message}>
          <Input id="displayName" autoComplete="name" autoFocus aria-invalid={!!err.displayName} {...register('displayName')} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={err.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="you@example.com"
            aria-invalid={!!err.email}
            {...register('email')}
          />
        </FormField>
        <FormField label="Password" htmlFor="password" error={err.password?.message} hint="At least 8 characters.">
          <PasswordInput
            id="password"
            autoComplete="new-password"
            className="font-sans"
            aria-invalid={!!err.password}
            {...register('password')}
          />
        </FormField>
        <FormField label="Confirm password" htmlFor="confirmPassword" error={err.confirmPassword?.message}>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            className="font-sans"
            aria-invalid={!!err.confirmPassword}
            {...register('confirmPassword')}
          />
        </FormField>
        <Button type="submit" className="w-full" loading={formState.isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthScreen>
  );
}
