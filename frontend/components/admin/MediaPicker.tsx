'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Search, Check, Upload, X } from 'lucide-react';
import { mediaService } from '@/services/mediaService';
import { Media } from '@/types/media';
import { Modal } from './Modal';
import { Button } from '@/components/ui/Button';
import { FileUploader } from './FileUploader';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { cn, mediaUrl } from '@/lib/utils';

export interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: Media) => void;
  selectedUrl?: string;
  allowedTypes?: string[]; // e.g. ['image', 'application/pdf']
  title?: string;
}

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  selectedUrl,
  allowedTypes,
  title = 'Select Media Asset',
}: MediaPickerProps) {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('image');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');

  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await mediaService.getMedia({
        search: debouncedSearch || undefined,
        type: typeFilter || undefined,
        per_page: 30,
      });
      setMediaList(res.data);
    } catch {
      toast.error('Failed to load media files');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, typeFilter, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, fetchMedia]);

  const handleUploadSuccess = () => {
    toast.success('File uploaded successfully');
    setActiveTab('library');
    fetchMedia();
  };

  const handleConfirmSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="2xl">
      <div className="space-y-4">
        {/* Tab switcher & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition',
                activeTab === 'library'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              Media Library
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition flex items-center gap-1.5',
                activeTab === 'upload'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <Upload className="w-3.5 h-3.5" /> Upload New
            </button>
          </div>

          {activeTab === 'library' && (
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'upload' ? (
          <div className="p-4">
            <FileUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 min-h-[300px] p-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
                ))}
              </div>
            ) : mediaList.length === 0 ? (
              <div className="text-center py-16 space-y-2 text-xs text-gray-400">
                <ImageIcon className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-700" />
                <p>No media files matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-[420px] overflow-y-auto p-1">
                {mediaList.map((item) => {
                  const url = mediaUrl(item.url);
                  const isSelected =
                    selectedMedia?.id === item.id ||
                    (!selectedMedia && mediaUrl(selectedUrl) === url);
                  const isImage = item.mime_type.startsWith('image/');

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMedia({ ...item, url })}
                      className={cn(
                        'group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-150 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/40',
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/20 shadow-md'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                      )}
                    >
                      {isImage ? (
                        <img
                          src={url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                      ) : (
                        <div className="p-2 text-center">
                          <ImageIcon className="w-8 h-8 mx-auto text-gray-400" />
                          <p className="text-[10px] text-gray-500 truncate mt-1">{item.name}</p>
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-sm">
                {selectedMedia ? (
                  <span>Selected: <strong className="text-gray-900 dark:text-gray-100">{selectedMedia.name}</strong></span>
                ) : (
                  <span>No media asset selected</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleConfirmSelect} disabled={!selectedMedia}>
                  Select Asset
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
