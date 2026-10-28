'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  ArrowRight,
  Layers,
  ShieldCheck,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const highlights = [
  {
    icon: ShieldCheck,
    title: 'Secure by default',
    detail: 'Sanctum sessions, roles, and permission gates.',
  },
  {
    icon: Gauge,
    title: 'Ready-made admin',
    detail: 'Users, media, menus, settings, and system tools.',
  },
  {
    icon: Sparkles,
    title: 'Reusable UI kit',
    detail: 'Consistent forms and panels across every screen.',
  },
];

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/admin');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormMessage(null);
    setIsLoading(true);

    try {
      await login({ email, password, remember });
      toast.success('Welcome back', 'You have been authenticated.');
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errors?: Record<string, string[]> };
      if (errorObj.errors) {
        setErrors(errorObj.errors);
      }
      setFormMessage(errorObj.message || 'Please check your email and password.');
      toast.error('Authentication failed', errorObj.message || 'Please check your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07133A]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* Brand plane */}
      <aside className="relative hidden overflow-hidden bg-[#07133A] text-white lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,_rgb(29_75_232_/_0.55),_transparent_45%),radial-gradient(ellipse_at_85%_75%,_rgb(14_165_233_/_0.22),_transparent_40%)]"
        />
        <div
          aria-hidden
          className="auth-grid pointer-events-none absolute inset-0 opacity-[0.22]"
        />
        <div
          aria-hidden
          className="auth-orb pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="auth-orb-delayed pointer-events-none absolute right-[-4rem] bottom-16 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl"
        />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <Layers className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">NextLaravel</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <p className="animate-rise text-xs font-semibold tracking-[0.22em] text-sky-200/90 uppercase">
            Administrator portal
          </p>
          <h1 className="animate-rise-delay font-display text-4xl leading-[1.1] font-semibold tracking-tight xl:text-5xl">
            Command your product from one calm control room.
          </h1>
          <p className="animate-rise-delay-2 max-w-md text-base leading-relaxed text-slate-300">
            Sign in to manage users, content, system health, and the settings that keep your
            application running.
          </p>

          <ul className="animate-rise-delay-2 mt-8 space-y-4">
            {highlights.map(({ icon: Icon, title, detail }) => (
              <li key={title} className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4 w-4 text-sky-200" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm text-slate-300">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-400">
          Protected access · Production-ready starter foundation
        </p>
      </aside>

      {/* Form plane */}
      <section className="relative flex min-h-screen flex-col bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgb(29_75_232_/_0.08),_transparent_45%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgb(59_99_246_/_0.14),_transparent_45%)] lg:hidden"
        />

        <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2.5 lg:invisible lg:pointer-events-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Layers className="h-4 w-4" />
            </div>
            <span className="font-display text-sm font-semibold tracking-tight text-foreground">
              NextLaravel
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              href="/"
              className="rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              Back to site
            </Link>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="animate-rise mb-8 space-y-3 lg:mb-10">
              <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase lg:hidden">
                Administrator portal
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
                Welcome back
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                Enter your credentials to open the admin dashboard.
              </p>
            </div>

            <div className="animate-rise-delay space-y-5">
              <FormError message={formMessage} />

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.[0]}
                  autoComplete="email"
                  autoFocus
                  required
                />

                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  error={errors.password?.[0]}
                  autoComplete="current-password"
                  required
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <Checkbox
                    id="remember-me"
                    label="Remember me"
                    checked={remember}
                    onChange={setRemember}
                  />
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-primary transition hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="mt-2 h-11 w-full"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Sign in to dashboard
                </Button>
              </form>
            </div>

            <p className="animate-rise-delay-2 mt-8 text-center text-xs text-muted-foreground">
              Need the public site?{' '}
              <Link href="/" className="font-medium text-foreground transition hover:text-primary">
                Return home
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
