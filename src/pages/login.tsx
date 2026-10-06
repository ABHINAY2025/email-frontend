import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common/form-field';
import { ErrorNote } from '@/components/common/states';
import { ProductLogo } from '@/components/layout/product-mark';
import { FullScreenLoader } from '@/components/layout/boot';
import { useAuth } from '@/hooks/use-auth';
import { ApiClientError, errorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';

const schema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { resolved, toggle } = useTheme();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { username: '', password: '' } });
  const { register, handleSubmit, formState } = form;

  const from = params.get('from');
  const target = from && from.startsWith('/') && !from.startsWith('//') && !from.startsWith('/login') ? from : '/dashboard';

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
          ? 'Incorrect username or password.'
          : errorMessage(e, 'Sign in failed. Please try again.'),
      );
    }
  });

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <Button variant="ghost" size="icon-sm" className="absolute right-4 top-4" onClick={toggle} aria-label="Toggle theme">
        {resolved === 'dark' ? <Sun className="!size-4" /> : <Moon className="!size-4" />}
      </Button>

      <div className="w-full max-w-[360px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <ProductLogo className="mb-4 size-9" />
          <h1 className="text-lg font-semibold tracking-tight">Sign in to ApplyFlow</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">Your job applications, tracked from your inbox.</p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-xl border bg-card p-5">
          {error && <ErrorNote>{error}</ErrorNote>}
          <FormField label="Username" htmlFor="username" error={formState.errors.username?.message}>
            <Input
              id="username"
              autoComplete="username"
              autoFocus
              aria-invalid={!!formState.errors.username}
              {...register('username')}
            />
          </FormField>
          <FormField label="Password" htmlFor="password" error={formState.errors.password?.message}>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                className="pr-9"
                aria-invalid={!!formState.errors.password}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted-foreground hover:text-foreground focus-ring rounded-r-md"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </FormField>
          <Button type="submit" className="w-full" loading={formState.isSubmitting}>
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-subtle">Private single-user workspace.</p>
      </div>
    </div>
  );
}
