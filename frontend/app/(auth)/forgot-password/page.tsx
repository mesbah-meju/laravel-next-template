'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { authService } from '@/services/authService';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
      toast.success('Reset Link Dispatched', 'Please check your email inbox.');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to request password reset.';
      setError(msg);
      toast.error('Request Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Forgot Password
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter your account email to receive a password reset link.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
          {isSubmitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Check Your Email</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                If an account exists for <strong className="text-gray-800 dark:text-gray-200">{email}</strong>, a password reset link has been dispatched.
              </p>
              <Link href="/admin-login">
                <Button variant="outline" size="sm" className="mt-4">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Account Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={error || undefined}
                required
              />

              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
                Send Reset Link <Send className="w-4 h-4 ml-1" />
              </Button>
            </form>
          )}
        </div>

        <div className="text-center text-xs text-gray-400">
          <Link href="/admin-login" className="inline-flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
