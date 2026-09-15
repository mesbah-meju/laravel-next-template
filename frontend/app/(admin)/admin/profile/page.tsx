'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Mail, Shield } from 'lucide-react';
import { profileService } from '@/services/profileService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/admin/PageHeader';
import { ImagePicker } from '@/components/admin/ImagePicker';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { FormError } from '@/components/ui/FormError';
import { FormSection } from '@/components/ui/FormSection';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function AdminProfilePage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    avatar: '' as string | null | undefined,
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [generalProfileError, setGeneralProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
  const [generalPasswordError, setGeneralPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setGeneralProfileError(null);
    setIsSavingProfile(true);

    try {
      await profileService.updateProfile({
        name: profileForm.name,
        email: profileForm.email,
        avatar: profileForm.avatar || null,
      });
      await refreshUser();
      toast.success('Profile Updated', 'Your profile details have been saved.');
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errors?: Record<string, string[]> };
      if (errorObj.errors) setProfileErrors(errorObj.errors);
      setGeneralProfileError(errorObj.message || 'Failed to update profile.');
      toast.error('Update Failed', errorObj.message || 'Check validation errors.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setGeneralPasswordError(null);
    setIsSavingPassword(true);

    try {
      await profileService.updatePassword(passwordForm);
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      toast.success('Password Updated', 'Your password has been changed successfully.');
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errors?: Record<string, string[]> };
      if (errorObj.errors) setPasswordErrors(errorObj.errors);
      setGeneralPasswordError(errorObj.message || 'Failed to update password.');
      toast.error('Password Update Failed', errorObj.message || 'Check your current password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const roleNames = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'string' ? r : r.name)).join(', ')
    : 'User';

  const userPermissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p) => (typeof p === 'string' ? p : p.name))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personal Profile"
        description="Manage your account profile details, avatar image, and security password."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-6 flex flex-col items-center text-center">
            <div className="relative">
              {profileForm.avatar ? (
                <img
                  src={profileForm.avatar}
                  alt={profileForm.name}
                  className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-indigo-600"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-md">
                  {profileForm.name.charAt(0) || 'A'}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{user?.name}</h3>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>

            <div className="w-full pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
              <span className="text-gray-500">System Role:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> {roleNames}
              </span>
            </div>

            <div className="w-full flex items-center justify-between text-xs">
              <span className="text-gray-500">Account Status:</span>
              <StatusBadge status={user?.status || 'active'} />
            </div>
          </div>

          {/* Permissions Overview (Read-Only) */}
          <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Active Permissions
            </h4>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {roleNames.includes('Super Admin') ? (
                <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-md">
                  * Unrestricted Super Admin Authority
                </span>
              ) : userPermissions.length === 0 ? (
                <span className="text-xs text-gray-400">Standard user capabilities</span>
              ) : (
                userPermissions.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded font-mono"
                  >
                    {p}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Forms Container */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Details Form */}
          <FormSection
            title="Account Information"
            description="Update your display name, contact email, and avatar picture."
          >
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <FormError message={generalProfileError} errors={profileErrors} />

              <Input
                label="Full Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="John Doe"
                error={profileErrors.name?.[0]}
                required
              />

              <Input
                label="Email Address"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="john@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={profileErrors.email?.[0]}
                required
              />

              <ImagePicker
                label="Profile Avatar"
                value={profileForm.avatar}
                onChange={(url) => setProfileForm({ ...profileForm, avatar: url })}
              />

              <div className="pt-2 flex justify-end">
                <SubmitButton isLoading={isSavingProfile} label="Save Profile" size="sm" />
              </div>
            </form>
          </FormSection>

          {/* Change Password Form */}
          <FormSection
            title="Update Password"
            description="Ensure your account is utilizing a long, secure password."
          >
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <FormError message={generalPasswordError} errors={passwordErrors} />

              <Input
                label="Current Password"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={passwordErrors.current_password?.[0]}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={passwordErrors.password?.[0]}
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.password_confirmation}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={passwordErrors.password_confirmation?.[0]}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <SubmitButton isLoading={isSavingPassword} label="Update Password" size="sm" />
              </div>
            </form>
          </FormSection>
        </div>
      </div>
    </div>
  );
}
