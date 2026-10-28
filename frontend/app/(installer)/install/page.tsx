'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Database,
  Server,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { useToast } from '@/hooks/useToast';
import { installerService } from '@/services/installerService';
import { RequirementsResponse, InstallerEnvironmentPayload } from '@/types/installer';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export default function WebInstallerPage() {
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [setupToken, setSetupToken] = useState('');

  // Step 2: Requirements
  const [requirements, setRequirements] = useState<RequirementsResponse | null>(null);
  const [isLoadingReqs, setIsLoadingReqs] = useState(false);

  // Step 3 & 4: Application & Database Configuration
  const [formData, setFormData] = useState<InstallerEnvironmentPayload>({
    app_name: 'NextLaravel Application',
    app_url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    app_env: 'production',
    app_timezone: 'UTC',
    app_locale: 'en',
    db_connection: 'mysql',
    db_host: '127.0.0.1',
    db_port: 3306,
    db_database: 'nextlaravel',
    db_username: 'root',
    db_password: '',
  });

  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestPassed, setDbTestPassed] = useState(false);

  // Step 5: Migration Runner
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationPassed, setMigrationPassed] = useState(false);
  const [migrationLogs, setMigrationLogs] = useState('');

  // Step 6: Super Admin
  const [adminName, setAdminName] = useState('Administrator');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await installerService.getStatus();
        if (res.data.is_installed) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      } catch {
        setIsLocked(false);
      } finally {
        setIsLoadingStatus(false);
      }
    }
    checkStatus();
  }, []);

  const fetchRequirements = async () => {
    setIsLoadingReqs(true);
    try {
      const res = await installerService.getRequirements();
      if (res.data) {
        setRequirements(res.data);
      }
    } catch {
      toast.error('Failed to verify server requirements');
    } finally {
      setIsLoadingReqs(false);
    }
  };

  const handleTestDatabase = async () => {
    setIsTestingDb(true);
    try {
      const res = await installerService.testDatabase(formData, setupToken);
      toast.success(res.message || 'Database connection successful!');
      setDbTestPassed(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Database connection failed';
      toast.error(msg);
      setDbTestPassed(false);
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleSaveEnvironment = async () => {
    try {
      await installerService.saveEnvironment(formData, setupToken);
      toast.success('Configuration saved');
      setCurrentStep(5);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save configuration';
      toast.error(msg);
    }
  };

  const handleRunMigrations = async () => {
    setIsMigrating(true);
    try {
      const res = await installerService.setupDatabase(setupToken);
      toast.success('Database schema and core roles initialized');
      setMigrationPassed(true);
      setMigrationLogs(res.data?.output || 'Migrations finished successfully.');
      setTimeout(() => setCurrentStep(6), 1200);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Migration setup failed';
      toast.error(msg);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword !== adminPasswordConfirm) {
      toast.error('Passwords do not match');
      return;
    }

    setIsCreatingAdmin(true);
    try {
      await installerService.createSuperAdmin({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        password_confirmation: adminPasswordConfirm,
      }, setupToken);
      toast.success('Super Admin account created and application locked!');
      setCurrentStep(7);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create Super Admin';
      toast.error(msg);
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Checking installation state...</p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <div className="max-w-md w-full bg-card border border-border p-8 rounded-2xl shadow-lg text-center space-y-4">
          <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Installer Locked</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This application is already installed and protected. To re-run installation, execute{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary">
              php artisan app:unlock-installer
            </code>{' '}
            from your terminal.
          </p>
          <div className="pt-2">
            <Button asChild className="w-full">
              <Link href="/admin-login">Proceed to Admin Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" /> NextLaravel Deployment Wizard
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Application Installation
          </h1>
          <p className="text-xs text-muted-foreground">Step {currentStep} of 7</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* STEP 1: WELCOME */}
          {currentStep === 1 && (
            <div className="space-y-6 text-center">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
                <Server className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Welcome to the Starter Installer</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                  This automated setup assistant will verify your server dependencies, test your database
                  connection, configure application keys, and initialize the first Super Admin account.
                </p>
              </div>

              <div className="max-w-md mx-auto text-left pt-2">
                <FormField
                  label="Setup Authorization Token"
                  hint="If required by your server, enter the token generated via php artisan app:generate-installer-token"
                >
                  <Input
                    type="password"
                    placeholder="Enter setup token (optional in local dev)"
                    value={setupToken}
                    onChange={(e) => setSetupToken(e.target.value)}
                    className="font-mono text-xs"
                  />
                </FormField>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => {
                    setCurrentStep(2);
                    fetchRequirements();
                  }}
                  className="w-full sm:w-auto px-8"
                >
                  Start Installation <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: REQUIREMENTS */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground">1. Server & Environment Requirements</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verifying PHP runtime extensions, database drivers, and directory write permissions.
                </p>
              </div>

              {isLoadingReqs ? (
                <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                  Verifying runtime environment...
                </div>
              ) : requirements ? (
                <div className="space-y-4">
                  <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">PHP Version ({requirements.php_version.current})</span>
                    {requirements.php_version.passed ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Passed (&gt;= 8.2)
                      </span>
                    ) : (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <XCircle className="h-4 w-4" /> Upgrade Required (&gt;= 8.2)
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Required PHP Extensions
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {requirements.extensions.map((ext) => (
                        <div
                          key={ext.extension}
                          className="p-2.5 rounded-lg border border-border bg-background flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-foreground">{ext.label}</span>
                          {ext.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Directory Permissions
                    </div>
                    <div className="space-y-1.5">
                      {requirements.permissions.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-border bg-background flex items-center justify-between text-xs"
                        >
                          <span className="font-mono text-muted-foreground">{p.path}</span>
                          {p.passed ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Writable
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              <XCircle className="h-3.5 w-3.5" /> Not Writable
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  disabled={requirements ? !requirements.is_ready : false}
                >
                  Configure Application <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: APPLICATION CONFIGURATION */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">2. Application Identity & Localization</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set the public site name, canonical URL, and regional defaults.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Application Name" required>
                  <Input
                    value={formData.app_name}
                    onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                    required
                  />
                </FormField>

                <FormField label="Application Public URL" required>
                  <Input
                    value={formData.app_url}
                    onChange={(e) => setFormData({ ...formData, app_url: e.target.value })}
                    required
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField label="Environment">
                  <Select
                    value={formData.app_env}
                    onChange={(e) =>
                      setFormData({ ...formData, app_env: e.target.value as 'production' | 'local' | 'staging' })
                    }
                    options={[
                      { label: 'Production (Secure)', value: 'production' },
                      { label: 'Local Development', value: 'local' },
                      { label: 'Staging', value: 'staging' },
                    ]}
                  />
                </FormField>

                <FormField label="Default Timezone">
                  <Input
                    value={formData.app_timezone}
                    onChange={(e) => setFormData({ ...formData, app_timezone: e.target.value })}
                  />
                </FormField>

                <FormField label="Default Language">
                  <Select
                    value={formData.app_locale}
                    onChange={(e) => setFormData({ ...formData, app_locale: e.target.value })}
                    options={[
                      { label: 'English (en)', value: 'en' },
                      { label: 'Spanish (es)', value: 'es' },
                      { label: 'French (fr)', value: 'fr' },
                      { label: 'German (de)', value: 'de' },
                    ]}
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>
                <Button onClick={() => setCurrentStep(4)}>
                  Configure Database <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: DATABASE CONFIGURATION */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">3. Database Connection</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure your MySQL, PostgreSQL, or SQLite database credentials.
                </p>
              </div>

              <FormField label="Database Driver">
                <Select
                  value={formData.db_connection}
                  onChange={(e) =>
                    setFormData({ ...formData, db_connection: e.target.value as 'mysql' | 'sqlite' | 'pgsql' })
                  }
                  options={[
                    { label: 'MySQL / MariaDB', value: 'mysql' },
                    { label: 'SQLite', value: 'sqlite' },
                    { label: 'PostgreSQL', value: 'pgsql' },
                  ]}
                />
              </FormField>

              {formData.db_connection !== 'sqlite' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <FormField label="Host">
                        <Input
                          value={formData.db_host}
                          onChange={(e) => setFormData({ ...formData, db_host: e.target.value })}
                          placeholder="127.0.0.1"
                        />
                      </FormField>
                    </div>
                    <div>
                      <FormField label="Port">
                        <Input
                          type="number"
                          value={formData.db_port?.toString()}
                          onChange={(e) => setFormData({ ...formData, db_port: parseInt(e.target.value, 10) || 3306 })}
                        />
                      </FormField>
                    </div>
                  </div>

                  <FormField label="Database Name" required>
                    <Input
                      value={formData.db_database}
                      onChange={(e) => setFormData({ ...formData, db_database: e.target.value })}
                      required
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Username">
                      <Input
                        value={formData.db_username}
                        onChange={(e) => setFormData({ ...formData, db_username: e.target.value })}
                      />
                    </FormField>

                    <FormField label="Password">
                      <Input
                        type="password"
                        value={formData.db_password}
                        onChange={(e) => setFormData({ ...formData, db_password: e.target.value })}
                      />
                    </FormField>
                  </div>
                </>
              ) : (
                <FormField label="SQLite Database Path">
                  <Input
                    value={formData.db_database}
                    onChange={(e) => setFormData({ ...formData, db_database: e.target.value })}
                    placeholder="database/database.sqlite"
                  />
                </FormField>
              )}

              <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestDatabase}
                  disabled={isTestingDb}
                >
                  <Database className="h-4 w-4 mr-1.5" />
                  {isTestingDb ? 'Testing Connection...' : 'Test Database Connection'}
                </Button>

                {dbTestPassed && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Connection Verified
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>
                <Button onClick={handleSaveEnvironment} disabled={!dbTestPassed}>
                  Save & Migrate <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: MIGRATIONS */}
          {currentStep === 5 && (
            <div className="space-y-6 text-center">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
                <Database className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Initialize Database Schema</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                  Execute standard schema migrations and seed initial roles & permissions.
                </p>
              </div>

              {isMigrating ? (
                <div className="p-6 bg-muted rounded-xl space-y-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary mx-auto" />
                  <div className="text-xs font-medium text-foreground">Running migrations and seeders...</div>
                </div>
              ) : migrationPassed ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Schema & Permissions Ready!
                </div>
              ) : (
                <Button onClick={handleRunMigrations} className="px-8">
                  Run Database Setup
                </Button>
              )}

              {migrationLogs && (
                <pre className="p-3 bg-zinc-950 text-emerald-400 text-left font-mono text-[11px] rounded-lg max-h-40 overflow-y-auto">
                  {migrationLogs}
                </pre>
              )}
            </div>
          )}

          {/* STEP 6: SUPER ADMIN CREATION */}
          {currentStep === 6 && (
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-foreground">4. Create Super Administrator</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  This user will have unrestricted permissions across all modules.
                </p>
              </div>

              <FormField label="Full Name" required>
                <Input
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Master Admin"
                  required
                />
              </FormField>

              <FormField label="Email Address" required>
                <Input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@yourdomain.com"
                  required
                />
              </FormField>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <PasswordInput
                  label="Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  minLength={8}
                  showRequirements
                />

                <PasswordInput
                  label="Confirm password"
                  value={adminPasswordConfirm}
                  onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <SubmitButton isLoading={isCreatingAdmin}>Finalize Installation</SubmitButton>
              </div>
            </form>
          )}

          {/* STEP 7: COMPLETE */}
          {currentStep === 7 && (
            <div className="space-y-6 text-center">
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Installation Complete!</h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                  Your starter application has been successfully configured and secured. The installer is now
                  locked to prevent unauthorized modifications.
                </p>
              </div>

              <div className="pt-4">
                <Button asChild className="w-full px-8 sm:w-auto">
                  <Link href="/admin-login">Go to Admin Login</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
