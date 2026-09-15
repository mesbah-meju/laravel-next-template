'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Edit2, Trash2, Lock, Users } from 'lucide-react';
import { roleService } from '@/services/roleService';
import { permissionService, GroupedPermissionItem } from '@/services/permissionService';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/admin/PageHeader';
import { Modal } from '@/components/admin/Modal';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormError } from '@/components/ui/FormError';
import { Role } from '@/types/user';

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, GroupedPermissionItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const toast = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        roleService.getRoles(),
        permissionService.getPermissions(),
      ]);
      setRoles(rolesRes.data);
      setGroupedPermissions(permsRes.data.grouped);
    } catch {
      toast.error('Failed to load roles and permissions');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setSelectedRole(null);
    setIsEditMode(false);
    setRoleName('');
    setSelectedPermissions([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setIsEditMode(true);
    setRoleName(role.name);
    const rolePerms = role.permissions ? role.permissions.map((p) => p.name) : [];
    setSelectedPermissions(rolePerms);
    setFormError(null);
    setIsModalOpen(true);
  };

  const togglePermission = (permName: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
    );
  };

  const toggleGroupAll = (groupItems: GroupedPermissionItem[]) => {
    const groupPermNames = groupItems.map((p) => p.name);
    const allSelected = groupPermNames.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !groupPermNames.includes(p)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...groupPermNames])));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      if (isEditMode && selectedRole) {
        await roleService.updateRole(selectedRole.id, {
          name: roleName,
          permissions: selectedPermissions,
        });
        toast.success('Role Updated', `${roleName} was updated successfully.`);
      } else {
        await roleService.createRole({
          name: roleName,
          permissions: selectedPermissions,
        });
        toast.success('Role Created', `${roleName} was created successfully.`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Operation failed.';
      setFormError(msg);
      toast.error('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      await roleService.deleteRole(selectedRole.id);
      toast.success('Role Deleted', `${selectedRole.name} was removed.`);
      setIsDeleteOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error('Deletion Failed', (err as { message?: string })?.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PermissionGuard permission="manage-roles">
      <div className="space-y-6">
        <PageHeader
          title="Roles & Authorization"
          description="Manage security roles, assign grouped capabilities, and inspect assigned user counts."
          actions={
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-1.5" /> Create Role
            </Button>
          }
        />

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-64 animate-pulse" />
            ))
          ) : (
            roles.map((role) => {
              const isSuper = role.name === 'Super Admin';
              const rolePermNames = role.permissions ? role.permissions.map((p) => p.name) : [];
              const usersCount = (role as Role & { users_count?: number }).users_count ?? 0;

              return (
                <div
                  key={role.id}
                  className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          {isSuper ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{role.name}</h3>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-400" /> {usersCount} assigned {usersCount === 1 ? 'user' : 'users'}
                          </span>
                        </div>
                      </div>
                      {!isSuper && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(role)}
                            className="p-1 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            title="Edit role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRole(role);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            title="Delete role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      {isSuper
                        ? 'Super Administrators possess unrestricted server authority across all system modules.'
                        : `Configured with ${rolePermNames.length} granted system permissions.`}
                    </p>

                    <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                        Granted Permissions
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                        {isSuper ? (
                          <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold px-2 py-0.5 rounded-md">
                            * All System Permissions Granted
                          </span>
                        ) : rolePermNames.length === 0 ? (
                          <span className="text-xs text-gray-400">No permissions assigned</span>
                        ) : (
                          rolePermNames.map((p) => (
                            <span
                              key={p}
                              className="text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md font-mono"
                            >
                              {p}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Role Create / Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditMode ? `Edit Role: ${selectedRole?.name}` : 'Create New Security Role'}
          description="Assign capabilities and permissions grouped by domain."
          maxWidth="2xl"
        >
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <FormError message={formError} />

            <Input
              label="Role Name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. Content Editor"
              disabled={selectedRole?.name === 'Super Admin'}
              required
            />

            <div className="space-y-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Grant Permissions by Domain
              </label>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {Object.entries(groupedPermissions).map(([domain, perms]) => {
                  const allInGroupSelected = perms.every((p) => selectedPermissions.includes(p.name));

                  return (
                    <div
                      key={domain}
                      className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{domain} Domain</span>
                        <button
                          type="button"
                          onClick={() => toggleGroupAll(perms)}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                        >
                          {allInGroupSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.name);
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition ${
                                isChecked
                                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(perm.name)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="font-mono text-[11px] truncate">{perm.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
                {isEditMode ? 'Save Permissions' : 'Create Role'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmationDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteRole}
          title="Delete Role"
          message={`Are you sure you want to delete ${selectedRole?.name}? Users assigned to this role will lose associated permissions.`}
          isLoading={isSaving}
        />
      </div>
    </PermissionGuard>
  );
}
