import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Show } from 'meemaw';

import { AppButton } from '@medcord/ui';
import { IconEye, IconEyeOff } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';

interface LoginFormProps {
  readonly onSubmit: (email: string, password: string) => void;
  readonly isLoading: boolean;
  readonly error: string | null;
}

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const errs: { email?: string; password?: string } = {};
    if (email.trim() === '') {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (password === '') {
      errs.password = 'Password is required.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(email, password);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-charcoal-900">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
          placeholder="you@hospital.com"
        />
        <Show when={fieldErrors.email !== undefined}>
          <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
        </Show>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-charcoal-900">
            Password
          </label>
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-xs font-medium text-forest-900 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative mt-1">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 pr-10 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-charcoal-700"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          </button>
        </div>
        <Show when={fieldErrors.password !== undefined}>
          <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
        </Show>
      </div>

      <Show when={error !== null}>
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      </Show>

      <AppButton type="submit" loading={isLoading} className="w-full">
        Sign in
      </AppButton>
    </form>
  );
}
