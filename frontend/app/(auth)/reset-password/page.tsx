'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { AuthFrame } from '@/components/auth/AuthFrame';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const toast = useToast();

  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormMessage(null);
    setIsLoading(true);

    try {
      await authService.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setIsSuccess(true);
      toast.success('Password updated', 'You can now sign in with your new password.');
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errors?: Record<string, string[]> };
      if (errorObj.errors) {
        setErrors(errorObj.errors);
      }
      setFormMessage(errorObj.message || 'Please check your inputs.');
      toast.error('Reset failed', errorObj.message || 'Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-4 py-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="font-display text-base font-semibold text-foreground">Password updated</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your password has been changed successfully.
        </p>
        <Button asChild size="md" className="mt-2">
          <Link href="/admin-login">
            Continue to sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormError message={formMessage} />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        leftIcon={<Mail className="h-4 w-4" />}
        error={errors.email?.[0]}
        autoComplete="email"
        required
      />

      <PasswordInput
        label="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        error={errors.password?.[0]}
        showRequirements
        autoComplete="new-password"
        required
      />

      <PasswordInput
        label="Confirm password"
        value={passwordConfirmation}
        onChange={(e) => setPasswordConfirmation(e.target.value)}
        placeholder="••••••••"
        error={errors.password_confirmation?.[0]}
        autoComplete="new-password"
        required
      />

      <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
        Reset password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthFrame>
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Set a new password
          </h1>
          <p className="text-sm text-muted-foreground">Choose a strong password for your account.</p>
        </div>

        <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <Suspense
            fallback={
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Loading form...
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </AuthFrame>
  );
}
