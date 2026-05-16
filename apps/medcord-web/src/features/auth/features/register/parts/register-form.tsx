import { useState } from 'react';
import { Show } from 'meemaw';

import { AppButton } from '@medcord/ui';
import { IconEye, IconEyeOff } from '@icons';

interface RegisterFormProps {
  readonly onSubmit: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => void;
  readonly isLoading: boolean;
  readonly fieldErrors: Record<string, string> | null;
  readonly error: string | null;
}

export function RegisterForm({ onSubmit, isLoading, fieldErrors, error }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (name.trim() === '') {
      errs['name'] = 'Full name is required.';
    }
    if (email.trim() === '') {
      errs['email'] = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs['email'] = 'Enter a valid email address.';
    }
    if (password === '') {
      errs['password'] = 'Password is required.';
    } else if (password.length < 8) {
      errs['password'] = 'Password must be at least 8 characters.';
    }
    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ name, email, password, phone: phone.trim() !== '' ? phone : undefined });
  }

  const errors = Object.keys(localErrors).length > 0 ? localErrors : (fieldErrors ?? {});

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-charcoal-900">
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
          placeholder="Dr. Ada Okoye"
        />
        <Show when={errors['name'] !== undefined}>
          <p role="alert" className="mt-1 text-xs text-red-600">{errors['name']}</p>
        </Show>
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-charcoal-900">
          Email address
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
          placeholder="you@hospital.com"
        />
        <Show when={errors['email'] !== undefined}>
          <p role="alert" className="mt-1 text-xs text-red-600">{errors['email']}</p>
        </Show>
      </div>

      <div>
        <label htmlFor="reg-phone" className="block text-sm font-medium text-charcoal-900">
          Phone{' '}
          <span className="font-normal text-charcoal-700">(optional)</span>
        </label>
        <input
          id="reg-phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
          placeholder="+234 800 000 0000"
        />
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-charcoal-900">
          Password
        </label>
        <div className="relative mt-1">
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 pr-10 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900"
            placeholder="Min. 8 characters"
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
        <Show when={errors['password'] !== undefined}>
          <p role="alert" className="mt-1 text-xs text-red-600">{errors['password']}</p>
        </Show>
      </div>

      <Show when={error !== null}>
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      </Show>

      <AppButton type="submit" loading={isLoading} className="w-full">
        Create account
      </AppButton>
    </form>
  );
}
