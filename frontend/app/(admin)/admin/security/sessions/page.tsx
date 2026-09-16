'use client';

import React, { useState, useEffect } from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Clock,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { securityService } from '@/services/securityService';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/admin/PageHeader';
import { Modal } from '@/components/admin/Modal';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormError } from '@/components/ui/FormError';
import { UserSession } from '@/types/security';
import { cn } from '@/lib/utils';

export default function SessionsManagementPage() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Terminate Single Session
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  // Logout All Others
  const [isLogoutOthersOpen, setIsLogoutOthersOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoggingOutOthers, setIsLoggingOutOthers] = useState(false);

  const toast = useToast();

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await securityService.getActiveSessions();
      if (res.data) setSessions(res.data);
    } catch {
      toast.error('Failed to load active sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleTerminateSession = async () => {
    if (!selectedSessionId) return;
    setIsTerminating(true);
    try {
      await securityService.terminateSession(selectedSessionId);
      toast.success('Session Terminated', 'The device session has been revoked.');
      setIsTerminateOpen(false);
      setSelectedSessionId(null);
      fetchSessions();
    } catch {
      toast.error('Failed to terminate session');
    } finally {
      setIsTerminating(false);
    }
  };

  const handleLogoutOtherSessions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) {
      setPasswordError('Please enter your password to proceed.');
      return;
    }

    setIsLoggingOutOthers(true);
    setPasswordError(null);

    try {
      const res = await securityService.logoutOtherSessions(passwordInput);
      toast.success('Other Sessions Logged Out', res.message || 'All other devices have been logged out.');
      setIsLogoutOthersOpen(false);
      setPasswordInput('');
      fetchSessions();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Incorrect password.';
      setPasswordError(msg);
      toast.error('Operation Failed', msg);
    } finally {
      setIsLoggingOutOthers(false);
    }
  };

  const getDeviceIcon = (device?: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-5 h-5 text-indigo-500" />;
      case 'tablet':
        return <Tablet className="w-5 h-5 text-indigo-500" />;
      default:
        return <Laptop className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <PermissionGuard permission="manage-sessions">
      <div className="space-y-6">
        <PageHeader
          title="Active Browser Sessions"
          description="View devices currently signed into your account and log out unrecognized sessions."
          actions={
            sessions.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPasswordInput('');
                  setPasswordError(null);
                  setIsLogoutOthersOpen(true);
                }}
              >
                <LogOut className="w-4 h-4 mr-1.5 text-rose-500" /> Log Out Other Devices
              </Button>
            )
          }
        />

        {/* Security Notice */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-semibold text-indigo-950 dark:text-indigo-200">Session Security</h4>
            <p className="text-indigo-700 dark:text-indigo-300 leading-relaxed">
              If you notice any suspicious activity or unrecognized devices, you can revoke individual sessions or log out from all other browsers simultaneously.
            </p>
          </div>
        </div>

        {/* Sessions Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            No active database sessions found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'p-5 rounded-2xl border transition-all duration-150 flex flex-col justify-between space-y-4 shadow-sm bg-white dark:bg-gray-900',
                  session.is_current_device
                    ? 'border-indigo-300 dark:border-indigo-800/80 ring-1 ring-indigo-500/20'
                    : 'border-gray-200 dark:border-gray-800'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {session.browser} on {session.platform}
                        </h4>
                        {session.is_current_device && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            This Device
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-0.5">
                        IP: {session.ip_address || '—'}
                      </p>
                    </div>
                  </div>

                  {!session.is_current_device && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSessionId(session.id);
                        setIsTerminateOpen(true);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1 text-rose-500" /> Revoke
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" /> Last Active: {session.last_active_human}
                  </span>
                  <span className="font-mono text-[11px] text-gray-400 truncate max-w-[120px]">
                    ID: {session.id.slice(0, 10)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Terminate Single Session Confirmation */}
        <ConfirmationDialog
          isOpen={isTerminateOpen}
          onClose={() => {
            setIsTerminateOpen(false);
            setSelectedSessionId(null);
          }}
          onConfirm={handleTerminateSession}
          title="Revoke Session"
          message="Are you sure you want to revoke this session? The device will be signed out immediately."
          isLoading={isTerminating}
          confirmLabel="Revoke Session"
          variant="danger"
        />

        {/* Logout Other Sessions Modal */}
        <Modal
          isOpen={isLogoutOthersOpen}
          onClose={() => setIsLogoutOthersOpen(false)}
          title="Log Out Other Browser Sessions"
          description="Enter your account password to confirm logging out of all other devices."
        >
          <form onSubmit={handleLogoutOtherSessions} className="space-y-4">
            <FormError message={passwordError} />

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                This action will invalidate all other active sessions across your phones, tablets, and computers, keeping only this current browser session active.
              </p>
            </div>

            <Input
              label="Current Password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsLogoutOthersOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="submit"
                isLoading={isLoggingOutOthers}
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Log Out Other Sessions
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PermissionGuard>
  );
}
