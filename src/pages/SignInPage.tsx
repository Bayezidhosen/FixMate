import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { FixMateLogo } from '../components/FixMateLogo.tsx';

const signInSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInPage() {
  const { setUserDirect } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  });

  const submitCredentials = async (values: SignInValues) => {
    setServerError('');
    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || 'Invalid email or password.');
        return;
      }
      setUserDirect(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);

      if (redirectParam && redirectParam.startsWith('/')) {
        navigate(redirectParam, { replace: true });
      } else {
        navigate(`/dashboard/${data.user.role}`, { replace: true });
      }
    } catch {
      setServerError('Network error while signing in. Please try again.');
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'FixMate123', { shouldValidate: true });
    setServerError('');
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center bg-[#F7F9FC] dark:bg-[#0B1120] px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <FixMateLogo linkTo="/" />
          <h1 className="text-2xl font-extrabold text-[#101B35] dark:text-white tracking-tight pt-2">
            Sign in to FixMate
          </h1>
          <p className="text-sm text-[#68758A] dark:text-slate-400">
            Access your repair bookings, technician workspace, or admin console.
          </p>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(submitCredentials)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              placeholder="you@example.com"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
            />
            {errors.email && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                placeholder="Enter your password"
                className="w-full h-11 pl-3.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68758A] hover:text-[#172033] dark:hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Quick-fill seeded accounts for evaluation convenience */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <p className="text-xs font-semibold text-[#68758A] dark:text-slate-400">
            Demo Accounts (Quick Fill)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('customer@fixmate.dev')}
              className="py-2 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#172033] dark:text-slate-200 hover:border-[#3867FF] transition-colors"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => fillDemo('tech@fixmate.dev')}
              className="py-2 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#172033] dark:text-slate-200 hover:border-[#3867FF] transition-colors"
            >
              Technician
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@fixmate.dev')}
              className="py-2 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#172033] dark:text-slate-200 hover:border-[#3867FF] transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#68758A] dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link
            to={redirectParam ? `/sign-up?redirect=${encodeURIComponent(redirectParam)}` : '/sign-up'}
            className="font-semibold text-[#3867FF] dark:text-[#22D3EE] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
