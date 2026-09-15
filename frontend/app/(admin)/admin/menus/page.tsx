'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Save,
  ChevronRight,
  FolderTree,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import { menuService } from '@/services/menuService';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/admin/PageHeader';
import { Modal } from '@/components/admin/Modal';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Menu, MenuItem } from '@/types/menu';

export default function MenuBuilderPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Menu Creation/Editing Modal
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [menuForm, setMenuForm] = useState({ name: '', location: 'header', status: 'active' as 'active' | 'inactive' });

  // Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIdx, setEditingItemIdx] = useState<{ parentIdx: number | null; childIdx: number | null } | null>(null);
  const [itemForm, setItemForm] = useState<MenuItem>({
    title: '',
    url: '/',
    new_tab: false,
    icon: '',
    is_active: true,
  });

  const [isDeleteMenuOpen, setIsDeleteMenuOpen] = useState(false);
  const toast = useToast();

  const loadMenuDetails = useCallback(async (menuId: number | string) => {
    try {
      const res = await menuService.getAdminMenu(menuId);
      setSelectedMenu(res.data);
      setMenuItems(res.data.items || []);
    } catch {
      toast.error('Failed to load menu details');
    }
  }, [toast]);

  const fetchMenus = useCallback(async () => {
    try {
      const res = await menuService.getAdminMenus();
      setMenus(res.data);
      if (res.data.length > 0 && !selectedMenu) {
        loadMenuDetails(res.data[0].id);
      }
    } catch {
      toast.error('Failed to load navigation menus');
    }
  }, [loadMenuDetails, selectedMenu, toast]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleSaveTree = async () => {
    if (!selectedMenu) return;
    setIsSaving(true);
    try {
      await menuService.updateAdminMenu(selectedMenu.id, {
        name: selectedMenu.name,
        location: selectedMenu.location,
        status: selectedMenu.status,
        items: menuItems,
      });
      toast.success('Menu Tree Saved', 'Hierarchy updated and public cache invalidated.');
    } catch (err: unknown) {
      toast.error('Failed to save menu', (err as { message?: string })?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddItemModal = (parentIdx: number | null = null) => {
    setEditingItemIdx({ parentIdx, childIdx: null });
    setItemForm({
      title: '',
      url: '/',
      new_tab: false,
      icon: '',
      is_active: true,
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (parentIdx: number | null, childIdx: number | null) => {
    setEditingItemIdx({ parentIdx, childIdx });
    const targetItem =
      parentIdx === null
        ? menuItems[childIdx!]
        : menuItems[parentIdx].children![childIdx!];

    setItemForm({ ...targetItem });
    setIsItemModalOpen(true);
  };

  const handleSaveItemForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemIdx) return;
    const updated = [...menuItems];
    const { parentIdx, childIdx } = editingItemIdx;

    if (parentIdx === null && childIdx === null) {
      // Add top-level item
      updated.push({ ...itemForm, children: [] });
    } else if (parentIdx !== null && childIdx === null) {
      // Add child under parent
      const parent = updated[parentIdx];
      if (!parent.children) parent.children = [];
      parent.children.push({ ...itemForm });
    } else if (parentIdx === null && childIdx !== null) {
      // Edit top-level item
      updated[childIdx] = {
        ...updated[childIdx],
        ...itemForm,
      };
    } else if (parentIdx !== null && childIdx !== null) {
      // Edit child item
      if (updated[parentIdx].children) {
        updated[parentIdx].children[childIdx] = {
          ...updated[parentIdx].children[childIdx],
          ...itemForm,
        };
      }
    }

    setMenuItems(updated);
    setIsItemModalOpen(false);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const updated = [...menuItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setMenuItems(updated);
  };

  const toggleItemActive = (parentIdx: number | null, childIdx: number) => {
    const updated = [...menuItems];
    if (parentIdx === null) {
      updated[childIdx].is_active = !updated[childIdx].is_active;
    } else if (updated[parentIdx].children) {
      updated[parentIdx].children[childIdx].is_active = !updated[parentIdx].children[childIdx].is_active;
    }
    setMenuItems(updated);
  };

  const handleDeleteItem = (parentIdx: number | null, childIdx: number) => {
    const updated = [...menuItems];
    if (parentIdx === null) {
      updated.splice(childIdx, 1);
    } else {
      updated[parentIdx].children?.splice(childIdx, 1);
    }
    setMenuItems(updated);
  };

  const handleCreateMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await menuService.createAdminMenu(menuForm);
      toast.success('Menu Created', `${menuForm.name} was created.`);
      setIsMenuModalOpen(false);
      fetchMenus();
      loadMenuDetails(res.data.id);
    } catch (err: unknown) {
      toast.error('Failed to create menu', (err as { message?: string })?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMenu = async () => {
    if (!selectedMenu) return;
    setIsSaving(true);
    try {
      await menuService.deleteAdminMenu(selectedMenu.id);
      toast.success('Menu Deleted', `${selectedMenu.name} was deleted.`);
      setIsDeleteMenuOpen(false);
      setSelectedMenu(null);
      setMenuItems([]);
      fetchMenus();
    } catch (err: unknown) {
      toast.error('Deletion Failed', (err as { message?: string })?.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PermissionGuard permission="manage-menus">
      <div className="space-y-6">
        <PageHeader
          title="Menu Builder"
          description="Construct hierarchical navigation trees with recursive sub-items and instant cache invalidation."
          actions={
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setIsMenuModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Menu
              </Button>
              {selectedMenu && (
                <Button variant="primary" size="sm" onClick={handleSaveTree} isLoading={isSaving}>
                  <Save className="w-4 h-4 mr-1.5" /> Save Changes
                </Button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Menu Picker Sidebar */}
          <div className="space-y-3">
            <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2">
                Available Menus
              </span>
              {menus.map((m) => {
                const isSelected = selectedMenu?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => loadMenuDetails(m.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="truncate">
                      <p className="truncate">{m.name}</p>
                      <span className="text-[10px] text-gray-400 font-normal">Location: {m.location || 'none'}</span>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Menu Items Tree Editor */}
          <div className="md:col-span-3">
            {selectedMenu ? (
              <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{selectedMenu.name}</h2>
                    <p className="text-xs text-gray-400">
                      Location Target: <span className="font-mono text-indigo-600">{selectedMenu.location || 'none'}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openAddItemModal(null)} className="text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Top Item
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDeleteMenuOpen(true)}
                      className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Items Tree List */}
                {menuItems.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                    <FolderTree className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No navigation items</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">Add your first item using the button above.</p>
                    <Button variant="primary" size="sm" onClick={() => openAddItemModal(null)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Navigation Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {menuItems.map((item, pIdx) => (
                      <div
                        key={item.id ?? pIdx}
                        className={`rounded-xl border p-3 space-y-2 transition ${
                          item.is_active === false
                            ? 'border-gray-200 dark:border-gray-800 bg-gray-100/60 dark:bg-gray-900/40 opacity-70'
                            : 'border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40'
                        }`}
                      >
                        {/* Parent Item Row */}
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex items-center gap-0.5 text-gray-400">
                              <button
                                onClick={() => moveItem(pIdx, 'up')}
                                disabled={pIdx === 0}
                                className="p-0.5 hover:text-gray-700 disabled:opacity-30"
                                title="Move Up"
                              >
                                <MoveUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => moveItem(pIdx, 'down')}
                                disabled={pIdx === menuItems.length - 1}
                                className="p-0.5 hover:text-gray-700 disabled:opacity-30"
                                title="Move Down"
                              >
                                <MoveDown className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.title}</span>
                            <span className="font-mono text-[11px] text-gray-400 truncate max-w-xs">{item.url || '#'}</span>
                            {item.new_tab && (
                              <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <ExternalLink className="w-2.5 h-2.5" /> tab
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => toggleItemActive(null, pIdx)}
                              className="p-1 text-gray-400 hover:text-gray-700 rounded"
                              title={item.is_active === false ? 'Enable item' : 'Disable item'}
                            >
                              {item.is_active === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-emerald-500" />}
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAddItemModal(pIdx)}
                              className="text-[11px] text-indigo-600 hover:text-indigo-700"
                              title="Add sub-item"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Sub-item
                            </Button>
                            <button
                              onClick={() => openEditItemModal(null, pIdx)}
                              className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(null, pIdx)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Nested Children */}
                        {item.children && item.children.length > 0 && (
                          <div className="pl-6 pt-2 space-y-1.5 border-l-2 border-indigo-200 dark:border-indigo-900 ml-4">
                            {item.children.map((child, cIdx) => (
                              <div
                                key={child.id ?? cIdx}
                                className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                                  child.is_active === false
                                    ? 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60'
                                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-gray-400">└</span>
                                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{child.title}</span>
                                  <span className="font-mono text-[10px] text-gray-400 truncate">{child.url || '#'}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => toggleItemActive(pIdx, cIdx)}
                                    className="p-1 text-gray-400 hover:text-gray-700 rounded"
                                    title={child.is_active === false ? 'Enable sub-item' : 'Disable sub-item'}
                                  >
                                    {child.is_active === false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-emerald-500" />}
                                  </button>
                                  <button
                                    onClick={() => openEditItemModal(pIdx, cIdx)}
                                    className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                                    title="Edit sub-item"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(pIdx, cIdx)}
                                    className="p-1 text-gray-400 hover:text-rose-600 rounded"
                                    title="Delete sub-item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-xs text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                Select or create a menu to begin editing navigation.
              </div>
            )}
          </div>
        </div>

        {/* Item Create / Edit Modal */}
        <Modal
          isOpen={isItemModalOpen}
          onClose={() => setIsItemModalOpen(false)}
          title={editingItemIdx?.childIdx !== null ? 'Edit Menu Item' : 'Add Menu Item'}
          description="Specify label, target URL, and link behavior."
        >
          <form onSubmit={handleSaveItemForm} className="space-y-4">
            <Input
              label="Item Label"
              value={itemForm.title}
              onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
              placeholder="e.g. Documentation"
              required
            />

            <Input
              label="Target URL or Path"
              value={itemForm.url || ''}
              onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
              placeholder="e.g. /docs or https://example.com"
              required
            />

            <Input
              label="Icon (Optional)"
              value={itemForm.icon || ''}
              onChange={(e) => setItemForm({ ...itemForm, icon: e.target.value })}
              placeholder="e.g. Book, Layers, Home"
            />

            <Switch
              label="Open link in new tab"
              checked={!!itemForm.new_tab}
              onChange={(checked) => setItemForm({ ...itemForm, new_tab: checked })}
            />

            <Switch
              label="Item is active & visible"
              checked={itemForm.is_active !== false}
              onChange={(checked) => setItemForm({ ...itemForm, is_active: checked })}
            />

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsItemModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Apply Item
              </Button>
            </div>
          </form>
        </Modal>

        {/* Create Menu Modal */}
        <Modal
          isOpen={isMenuModalOpen}
          onClose={() => setIsMenuModalOpen(false)}
          title="Create New Navigation Menu"
          description="Set menu name and assigned frontend location."
        >
          <form onSubmit={handleCreateMenuSubmit} className="space-y-4">
            <Input
              label="Menu Name"
              value={menuForm.name}
              onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
              placeholder="e.g. Header Navigation"
              required
            />

            <Select
              label="Location Target"
              options={[
                { label: 'Header Navigation (header)', value: 'header' },
                { label: 'Footer Navigation (footer)', value: 'footer' },
                { label: 'Sidebar Navigation (sidebar)', value: 'sidebar' },
                { label: 'Custom Location (none)', value: '' },
              ]}
              value={menuForm.location}
              onChange={(e) => setMenuForm({ ...menuForm, location: e.target.value })}
            />

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsMenuModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
                Create Menu
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Menu Confirmation */}
        <ConfirmationDialog
          isOpen={isDeleteMenuOpen}
          onClose={() => setIsDeleteMenuOpen(false)}
          onConfirm={handleDeleteMenu}
          title="Delete Navigation Menu"
          message={`Are you sure you want to delete ${selectedMenu?.name}? All nested navigation items will be removed.`}
          isLoading={isSaving}
        />
      </div>
    </PermissionGuard>
  );
}
