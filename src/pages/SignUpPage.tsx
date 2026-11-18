import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { FixMateLogo } from '../components/FixMateLogo.tsx';

const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.'),
  role: z.enum(['customer', 'technician']),
  phone: z.string().trim().optional(),
  area: z.string().trim().optional(),
});

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpPage() {
  const { setUserDirect } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: 'customer',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: SignUpValues) => {
    setServerError('');
    try {
      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || 'Could not create account.');
        return;
      }
      setUserDirect(data.user);
      toast.success('Account created successfully!');
      if (redirectParam && redirectParam.startsWith('/') && data.user.role === 'customer') {
        navigate(redirectParam, { replace: true });
      } else {
        navigate(`/dashboard/${data.user.role}`, { replace: true });
      }
    } catch {
      setServerError('Network error while registering. Please try again.');
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center bg-[#F7F9FC] dark:bg-[#0B1120] px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-[#151E30] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <FixMateLogo linkTo="/" />
          <h1 className="text-2xl font-extrabold text-[#101B35] dark:text-white tracking-tight pt-2">
            Create your FixMate account
          </h1>
          <p className="text-sm text-[#68758A] dark:text-slate-400">
            Book repairs as a customer or list your services as a certified technician.
          </p>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs font-medium text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role Selection (Customer or Technician only) */}
          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#F7F9FC] dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setValue('role', 'customer')}
                className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                  selectedRole === 'customer'
                    ? 'bg-[#3867FF] text-white'
                    : 'text-[#68758A] dark:text-slate-300'
                }`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setValue('role', 'technician')}
                className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                  selectedRole === 'technician'
                    ? 'bg-[#3867FF] text-white'
                    : 'text-[#68758A] dark:text-slate-300'
                }`}
              >
                Technician
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="Alex Morgan"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
            />
            {errors.name && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="you@example.com"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
            />
            {errors.email && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Min 6 chars, 1 uppercase, 1 lowercase"
                className="w-full h-11 pl-3.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#68758A]"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
                Phone (Optional)
              </label>
              <input
                type="tel"
                {...register('phone')}
                placeholder="+1 (415) 555-0140"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172033] dark:text-slate-200 mb-1.5">
                Service Area (Optional)
              </label>
              <input
                type="text"
                {...register('area')}
                placeholder="Downtown / Westside"
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-[#0B1120] text-sm focus:outline-none focus:ring-2 focus:ring-[#3867FF]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-lg bg-[#3867FF] hover:bg-[#2B54DB] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-[#68758A] dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/sign-in"
            className="font-semibold text-[#3867FF] dark:text-[#22D3EE] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
