import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
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
import { useAuth } from '@/hooks/use-auth';
import { useAuthConfig } from '@/hooks/use-onboarding';
import { ApiClientError, errorMessage } from '@/lib/api';

const schema = z.object({
  username: z.string().trim().min(1, 'Enter your email or username'),
  password: z.string().min(1, 'Password is required'),
});
type Values = z.infer<typeof schema>;

/** Only same-origin, non-auth paths are valid post-login targets. */
export function safeReturnPath(from: string | null): string {
  return from && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login') && !from.startsWith('/register')
    ? from
    : '/dashboard';
}

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const config = useAuthConfig();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { username: '', password: '' } });
  const { register, handleSubmit, formState } = form;

  const target = safeReturnPath(params.get('from'));

  if (isLoading) return <FullScreenLoader />;
  if (user) return <Navigate to={target} replace />;

  const onSubmit = handleSubmit(async (v) => {
    setError(null);
    try {
      await login({ username: v.username.trim(), password: v.password });
      navigate(target, { replace: true });
    } catch (e) {
      form.resetField('password');
      setError(
        e instanceof ApiClientError && e.status === 401
          ? 'Incorrect email, username or password.'
          : errorMessage(e, 'Sign in failed. Please try again.'),
      );
    }
  });

  return (
    <AuthScreen
      title="Sign in to ApplyFlow"
      subtitle="Your job applications, tracked from your inbox."
      footer={
        config.data?.registrationEnabled ? (
          <>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline focus-ring rounded-sm">
              Create one
            </Link>
          </>
        ) : null
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-xl border bg-card p-5">
        {error && <ErrorNote>{error}</ErrorNote>}
        <FormField label="Email or username" htmlFor="username" error={formState.errors.username?.message}>
          <Input
            id="username"
            autoComplete="username"
            autoFocus
            spellCheck={false}
            aria-invalid={!!formState.errors.username}
            {...register('username')}
          />
        </FormField>
        <FormField label="Password" htmlFor="password" error={formState.errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            className="font-sans"
            aria-invalid={!!formState.errors.password}
            {...register('password')}
          />
        </FormField>
        <Button type="submit" className="w-full" loading={formState.isSubmitting}>
          Sign in
        </Button>
      </form>
    </AuthScreen>
  );
}
