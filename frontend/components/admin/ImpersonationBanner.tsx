'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, LogOut, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { impersonationService } from '@/services/impersonationService';
import { Button } from '@/components/ui/Button';

export function ImpersonationBanner() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalAdmin, setOriginalAdmin] = useState<{ id: number; name: string; email: string } | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const checkState = () => {
      const active = impersonationService.isImpersonating();
      setIsImpersonating(active);
      if (active) {
        setOriginalAdmin(impersonationService.getOriginalAdmin());
      }
    };

    checkState();
    window.addEventListener('storage', checkState);
    return () => window.removeEventListener('storage', checkState);
  }, []);

  if (!isImpersonating || !user) {
    return null;
  }

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await impersonationService.stop();
      toast.success('Session Restored', 'Returned to your Super Admin account.');
      window.location.href = '/admin/users';
    } catch (err: unknown) {
      toast.error('Failed to Exit Impersonation', (err as { message?: string })?.message);
      setIsStopping(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-4 z-50 sticky top-0 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-3 text-xs font-medium min-w-0">
        <div className="w-6 h-6 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
          <Shield className="w-3.5 h-3.5 text-amber-200" />
        </div>
        <div className="truncate">
          <span className="font-bold">IMPERSONATION ACTIVE:</span> You are currently viewing the system as{' '}
          <strong className="underline underline-offset-2">{user.name}</strong> ({user.email}).
          {originalAdmin && (
            <span className="text-amber-100 hidden md:inline ml-1.5">
              (Session created by {originalAdmin.name})
            </span>
          )}
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleStop}
        isLoading={isStopping}
        className="bg-white text-amber-900 hover:bg-amber-50 font-bold shrink-0 shadow-sm border-0"
      >
        <LogOut className="w-3.5 h-3.5 mr-1.5 text-amber-800" />
        Leave Impersonation
      </Button>
    </div>
  );
}
