'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { KeyRound, Plus, Trash2, Lock, Layers } from 'lucide-react';
import { permissionService, PermissionsResponse } from '@/services/permissionService';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/admin/PageHeader';
import { Modal } from '@/components/admin/Modal';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormError } from '@/components/ui/FormError';

const CORE_PERMISSIONS = [
  'view-dashboard',
  'manage-users',
  'manage-roles',
  'manage-permissions',
  'manage-menus',
  'manage-settings',
  'manage-media',
];

export default function PermissionsManagementPage() {
  const [data, setData] = useState<PermissionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [permissionName, setPermissionName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete states
  const [selectedPermission, setSelectedPermission] = useState<{ id: number; name: string } | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const toast = useToast();

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await permissionService.getPermissions();
      setData(res.data);
    } catch {
      toast.error('Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      await permissionService.createPermission({ name: permissionName.trim() });
      toast.success('Permission Created', `Permission "${permissionName}" was added.`);
      setIsModalOpen(false);
      setPermissionName('');
      fetchPermissions();
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || 'Failed to create permission.';
      setFormError(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedPermission) return;
    setIsSaving(true);

    try {
      await permissionService.deletePermission(selectedPermission.id);
      toast.success('Permission Deleted', `Permission "${selectedPermission.name}" was removed.`);
      setIsDeleteOpen(false);
      fetchPermissions();
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || 'Failed to delete permission.';
      toast.error('Deletion Failed', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PermissionGuard permission="manage-permissions">
      <div className="space-y-6">
        <PageHeader
          title="Permissions Management"
          description="View system capabilities grouped by domain module and manage granular access keys."
          actions={
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Create Permission
            </Button>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-48 animate-pulse" />
            ))}
          </div>
        ) : !data || Object.keys(data.grouped).length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
            No permissions found in the system.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(data.grouped).map(([groupName, items]) => (
              <div
                key={groupName}
                className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{groupName} Domain</h3>
                      <p className="text-[11px] text-gray-400">{items.length} capability keys</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {items.map((perm) => {
                    const isCore = CORE_PERMISSIONS.includes(perm.name);
                    const assignedRoles = perm.roles || [];

                    return (
                      <div
                        key={perm.id}
                        className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <KeyRound className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="font-mono font-semibold text-gray-800 dark:text-gray-200 truncate">
                              {perm.name}
                            </span>
                            {isCore && (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
                                <Lock className="w-2.5 h-2.5" /> Core
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-400">Assigned:</span>
                            {assignedRoles.length === 0 ? (
                              <span className="text-[10px] text-gray-400 italic">No roles</span>
                            ) : (
                              assignedRoles.map((r) => (
                                <span
                                  key={r.id}
                                  className="text-[10px] bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium"
                                >
                                  {r.name}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        {!isCore && (
                          <button
                            onClick={() => {
                              setSelectedPermission(perm);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                            title="Delete permission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Permission Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New System Permission"
          description="Define a new granular permission key (e.g., manage-products, publish-articles)."
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <FormError message={formError} />

            <Input
              label="Permission Key Name"
              value={permissionName}
              onChange={(e) => setPermissionName(e.target.value)}
              placeholder="e.g. manage-products"
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
            />

            <p className="text-[11px] text-gray-400">
              Tip: Use kebab-case format like <span className="font-mono text-indigo-500">manage-[resource]</span> or{' '}
              <span className="font-mono text-indigo-500">view-[resource]</span>.
            </p>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
                Create Permission
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmationDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteSubmit}
          title="Delete Permission"
          message={`Are you sure you want to delete permission "${selectedPermission?.name}"? Roles holding this permission will lose associated access.`}
          isLoading={isSaving}
        />
      </div>
    </PermissionGuard>
  );
}
