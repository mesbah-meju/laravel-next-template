'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Trash2,
  Copy,
  Check,
  FileIcon,
  ExternalLink,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIcon,
  Eye,
} from 'lucide-react';
import { mediaService } from '@/services/mediaService';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/admin/PageHeader';
import { FileUploader } from '@/components/admin/FileUploader';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { Modal } from '@/components/admin/Modal';
import { SearchInput } from '@/components/admin/SearchInput';
import { FilterBar } from '@/components/admin/FilterBar';
import { Pagination } from '@/components/admin/Pagination';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Select } from '@/components/ui/Select';
import { formatBytes, formatDate } from '@/lib/utils';
import { MediaItem } from '@/types/media';
import { PaginationMeta } from '@/types/api';

export default function MediaManagerPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    count: 0,
    per_page: 24,
    current_page: 1,
    total_pages: 1,
    has_more: false,
  });

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Preview & Delete States
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await mediaService.getMedia({
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        page,
        per_page: 24,
      });
      setMedia(res.data);
      setMeta(res.pagination);
    } catch {
      toast.error('Failed to load media files');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, typeFilter, page, toast]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleCopyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    toast.success('URL Copied', 'Public media URL copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteMedia = async () => {
    if (!selectedMedia) return;
    setIsSaving(true);
    try {
      await mediaService.deleteMedia(selectedMedia.id);
      toast.success('Media Deleted', `${selectedMedia.name} was removed.`);
      setIsDeleteOpen(false);
      if (previewMedia?.id === selectedMedia.id) setPreviewMedia(null);
      fetchMedia();
    } catch (err: unknown) {
      toast.error('Deletion Failed', (err as { message?: string })?.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PermissionGuard permission="manage-media">
      <div className="space-y-6">
        <PageHeader
          title="Media Library"
          description="Upload assets to public storage, inspect metadata, and manage stored files."
          actions={
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          }
        />

        {/* Upload Zone */}
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <FileUploader onUploadSuccess={() => fetchMedia()} />
        </div>

        {/* Filter Bar */}
        <FilterBar
          hasActiveFilters={!!search || !!typeFilter}
          onReset={() => {
            setSearch('');
            setTypeFilter('');
            setPage(1);
          }}
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Search media by filename..." />
          <div className="w-40">
            <Select
              options={[
                { label: 'All Media Types', value: '' },
                { label: 'Images', value: 'image' },
                { label: 'Documents', value: 'application' },
                { label: 'Videos', value: 'video' },
              ]}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </FilterBar>

        {/* Media Grid or List */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : media.length === 0 ? (
          <div className="text-center py-16 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">No media assets found</p>
            <p className="text-xs text-gray-400 mt-1">Upload an image or document above.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {media.map((item) => {
              const isImage = item.mime_type.startsWith('image/');
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="group relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
                >
                  {/* Thumbnail Preview */}
                  <div className="aspect-square bg-gray-50 dark:bg-gray-800/50 relative overflow-hidden flex items-center justify-center">
                    {isImage ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <FileIcon className="w-10 h-10 text-indigo-500" />
                    )}

                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                      <button
                        onClick={() => setPreviewMedia(item)}
                        className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-100 hover:scale-105 transition shadow-sm"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopyUrl(item)}
                        className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-900/90 text-gray-800 dark:text-gray-100 hover:scale-105 transition shadow-sm"
                        title="Copy Public URL"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMedia(item);
                          setIsDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-rose-600 text-white hover:scale-105 transition shadow-sm"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Details */}
                  <div className="p-2.5 space-y-0.5 border-t border-gray-100 dark:border-gray-800 text-[11px]">
                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between text-gray-400 text-[10px]">
                      <span>{formatBytes(item.size)}</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {media.map((item) => {
                const isImage = item.mime_type.startsWith('image/');
                const isCopied = copiedId === item.id;

                return (
                  <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
                        {isImage ? (
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <FileIcon className="w-5 h-5 text-indigo-500" />
                        )}
                      </div>
                      <div className="truncate text-xs">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                        <p className="text-gray-400 text-[11px] truncate font-mono">{item.url}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                      <span className="font-mono text-[11px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                        {formatBytes(item.size)}
                      </span>
                      <span className="hidden sm:inline text-gray-400 text-[11px]">{formatDate(item.created_at)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewMedia(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyUrl(item)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 transition"
                          title="Copy URL"
                        >
                          {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMedia(item);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        <Pagination meta={meta} onPageChange={setPage} />

        {/* Preview Modal */}
        <Modal
          isOpen={!!previewMedia}
          onClose={() => setPreviewMedia(null)}
          title="Media Asset Details"
          maxWidth="lg"
        >
          {previewMedia && (
            <div className="space-y-4">
              <div className="aspect-video rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                {previewMedia.mime_type.startsWith('image/') ? (
                  <img src={previewMedia.url} alt={previewMedia.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <FileIcon className="w-16 h-16 text-indigo-500" />
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div>
                    <span className="text-gray-400 block">Filename</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block">{previewMedia.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">File Size</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{formatBytes(previewMedia.size)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">MIME Type</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{previewMedia.mime_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Uploaded On</span>
                    <span className="text-gray-800 dark:text-gray-200">{formatDate(previewMedia.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={previewMedia.url}
                    className="w-full text-xs font-mono p-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  />
                  <button
                    onClick={() => handleCopyUrl(previewMedia)}
                    className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <a
                    href={previewMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    title="Open Full File"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteMedia}
          title="Delete Media File"
          message={`Are you sure you want to permanently delete "${selectedMedia?.name}" from storage?`}
          isLoading={isSaving}
        />
      </div>
    </PermissionGuard>
  );
}
