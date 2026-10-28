'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { AuthFrame } from '@/components/auth/AuthFrame';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
      toast.success('Reset link sent', 'Please check your email inbox.');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to request password reset.';
      setError(msg);
      toast.error('Request failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthFrame>
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Reset password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your account email and we will send a reset link.
          </p>
        </div>

        <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {isSubmitted ? (
            <div className="space-y-4 py-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">Check your email</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, a
                password reset link has been sent.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/admin-login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormError message={error} />

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                autoComplete="email"
                required
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                rightIcon={<Send className="h-4 w-4" />}
              >
                Send reset link
              </Button>
            </form>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/admin-login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to login
          </Link>
        </div>
      </div>
    </AuthFrame>
  );
}
