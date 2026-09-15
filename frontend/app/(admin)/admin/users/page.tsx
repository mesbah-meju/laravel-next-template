'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Shield, UserCheck, UserX, Mail, Lock } from 'lucide-react';
import { userService } from '@/services/userService';
import { roleService } from '@/services/roleService';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Pagination } from '@/components/admin/Pagination';
import { SearchInput } from '@/components/admin/SearchInput';
import { FilterBar } from '@/components/admin/FilterBar';
import { Modal } from '@/components/admin/Modal';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { FormError } from '@/components/ui/FormError';
import { formatDate } from '@/lib/utils';
import { User, UserStatus, Role } from '@/types/user';
import { PaginationMeta } from '@/types/api';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    count: 0,
    per_page: 15,
    current_page: 1,
    total_pages: 1,
    has_more: false,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [pendingStatusUser, setPendingStatusUser] = useState<{ user: User; nextStatus: UserStatus } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    status: 'active' as UserStatus,
    roles: ['User'] as string[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userService.getUsers({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        page,
        per_page: 15,
      });
      setUsers(res.data);
      setMeta(res.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, roleFilter, page, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await roleService.getRoles();
        setRoles(res.data);
      } catch {
        // Ignore
      }
    }
    fetchRoles();
  }, []);

  const openCreateModal = () => {
    setSelectedUser(null);
    setIsEditMode(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      status: 'active',
      roles: [roles[0]?.name || 'User'],
    });
    setFormErrors({});
    setGeneralError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsEditMode(true);
    const userRoleNames = Array.isArray(user.roles)
      ? user.roles.map((r) => (typeof r === 'string' ? r : r.name))
      : ['User'];

    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      status: user.status,
      roles: userRoleNames,
    });
    setFormErrors({});
    setGeneralError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralError(null);
    setIsSaving(true);

    try {
      if (isEditMode && selectedUser) {
        await userService.updateUser(selectedUser.id, {
          name: formData.name,
          email: formData.email,
          password: formData.password ? formData.password : undefined,
          status: formData.status,
          roles: formData.roles,
        });
        toast.success('User Updated', `${formData.name} was updated successfully.`);
      } else {
        await userService.createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          status: formData.status,
          roles: formData.roles,
        });
        toast.success('User Created', `${formData.name} was created successfully.`);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const errorObj = err as { message?: string; errors?: Record<string, string[]> };
      if (errorObj.errors) setFormErrors(errorObj.errors);
      setGeneralError(errorObj.message || 'Validation failed. Please review the inputs.');
      toast.error('Operation Failed', errorObj.message || 'Check validation errors.');
    } finally {
      setIsSaving(false);
    }
  };

  const promptToggleStatus = (user: User) => {
    const nextStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    setPendingStatusUser({ user, nextStatus });
    setIsStatusOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!pendingStatusUser) return;
    setIsSaving(true);

    try {
      await userService.toggleStatus(pendingStatusUser.user.id, pendingStatusUser.nextStatus);
      toast.success(
        'Status Changed',
        `${pendingStatusUser.user.name} is now ${pendingStatusUser.nextStatus}.`
      );
      setIsStatusOpen(false);
      setPendingStatusUser(null);
      fetchUsers();
    } catch (err: unknown) {
      toast.error('Failed to change status', (err as { message?: string })?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await userService.deleteUser(selectedUser.id);
      toast.success('User Deleted', `${selectedUser.name} was removed.`);
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      toast.error('Deletion Failed', (err as { message?: string })?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User Account',
      render: (u) => (
        <div className="flex items-center gap-3">
          {u.avatar ? (
            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
              {u.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{u.name}</p>
            <p className="text-xs text-gray-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Assigned Roles',
      render: (u) => {
        const roleNames = Array.isArray(u.roles)
          ? u.roles.map((r) => (typeof r === 'string' ? r : r.name)).join(', ')
          : '—';
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
            <Shield className="w-3.5 h-3.5 text-indigo-500" /> {roleNames || 'User'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: 'created_at',
      header: 'Registered',
      render: (u) => <span className="text-xs text-gray-400">{formatDate(u.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u) => {
        const isSelf = currentUser?.id === u.id;
        return (
          <div className="flex items-center justify-end gap-1.5">
            {!isSelf && (
              <button
                onClick={() => promptToggleStatus(u)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                title={u.status === 'active' ? 'Deactivate user' : 'Activate user'}
              >
                {u.status === 'active' ? (
                  <UserX className="w-4 h-4 text-amber-500" />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                )}
              </button>
            )}
            <button
              onClick={() => openEditModal(u)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
              title="Edit user"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {!isSelf && (
              <button
                onClick={() => {
                  setSelectedUser(u);
                  setIsDeleteOpen(true);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Delete user"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const roleOptions = roles.map((r) => ({ label: r.name, value: r.name }));

  return (
    <PermissionGuard permission="manage-users">
      <div className="space-y-6">
        <PageHeader
          title="User Accounts"
          description="View, filter, manage account statuses, and assign authorization roles."
          actions={
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-1.5" /> Create User
            </Button>
          }
        />

        {/* Filter Bar */}
        <FilterBar
          hasActiveFilters={!!search || !!statusFilter || !!roleFilter}
          onReset={() => {
            setSearch('');
            setStatusFilter('');
            setRoleFilter('');
            setPage(1);
          }}
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." />
          <div className="w-40">
            <Select
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Suspended', value: 'suspended' },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-40">
            <Select
              options={[
                { label: 'All Roles', value: '' },
                ...roles.map((r) => ({ label: r.name, value: r.name })),
              ]}
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </FilterBar>

        {/* Data Table */}
        <DataTable columns={columns} data={users} isLoading={isLoading} />

        {/* Pagination */}
        <Pagination meta={meta} onPageChange={setPage} />

        {/* Create / Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditMode ? `Edit User: ${selectedUser?.name}` : 'Create New User Account'}
          description="Specify account details and assign security roles."
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <FormError message={generalError} errors={formErrors} />

            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              error={formErrors.name?.[0]}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={formErrors.email?.[0]}
              required
            />

            <Input
              label={isEditMode ? 'Password (leave blank to keep unchanged)' : 'Password'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={formErrors.password?.[0]}
              required={!isEditMode}
            />

            <div className="space-y-3">
              <Select
                label="Account Status"
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                  { label: 'Suspended', value: 'suspended' },
                ]}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
              />

              <MultiSelect
                label="Assigned Roles"
                options={roleOptions}
                value={formData.roles}
                onChange={(newRoles) => setFormData({ ...formData, roles: newRoles })}
                placeholder="Choose roles..."
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
                {isEditMode ? 'Save Changes' : 'Create User'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Status Toggle Confirmation */}
        <ConfirmationDialog
          isOpen={isStatusOpen}
          onClose={() => {
            setIsStatusOpen(false);
            setPendingStatusUser(null);
          }}
          onConfirm={handleConfirmToggleStatus}
          title={pendingStatusUser?.nextStatus === 'active' ? 'Activate User' : 'Deactivate User'}
          message={`Are you sure you want to set ${pendingStatusUser?.user.name}'s status to "${pendingStatusUser?.nextStatus}"?`}
          isLoading={isSaving}
          confirmLabel={pendingStatusUser?.nextStatus === 'active' ? 'Activate' : 'Deactivate'}
          variant={pendingStatusUser?.nextStatus === 'active' ? 'primary' : 'danger'}
        />

        {/* Delete Confirmation */}
        <ConfirmationDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteUser}
          title="Delete User Account"
          message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
          isLoading={isSaving}
        />
      </div>
    </PermissionGuard>
  );
}
