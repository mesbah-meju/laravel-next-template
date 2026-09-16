'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Upload, Check, X } from 'lucide-react';
import { mediaService } from '@/services/mediaService';
import { MediaItem } from '@/types/media';
import { Modal } from './Modal';
import { FileUploader } from './FileUploader';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface ImagePickerProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  hint?: string;
  error?: string | string[];
  required?: boolean;
}

export function ImagePicker({
  value,
  onChange,
  label = 'Select Image',
  helperText,
  hint,
  error,
  required = false,
}: ImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [isLoading, setIsLoading] = useState(false);

  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await mediaService.getMedia({ type: 'image', per_page: 50 });
      setMediaList(res.data);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, loadMedia]);

  const handleSelect = (url: string) => {
    onChange(url);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
          {label}
          {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}

      <div className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xs">
        {value ? (
          <div className="relative w-14 h-14 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 shrink-0 group">
            <img src={value} alt="Selected" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-14 h-14 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 bg-gray-50/70 dark:bg-gray-800/40 shrink-0">
            <ImageIcon className="w-5 h-5" />
          </div>
        )}

        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="w-fit text-xs"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Choose from Media
          </Button>
          {value ? (
            <p className="text-[11px] text-gray-400 truncate max-w-xs">{value}</p>
          ) : (
            <p className="text-[11px] text-gray-400">PNG, JPG, SVG, WebP up to 5MB</p>
          )}
        </div>
      </div>

      {errorMessage && (
        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{errorMessage}</p>
      )}

      {displayedHint && !errorMessage && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400">{displayedHint}</p>
      )}

      {/* Media Picker Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Select Media Image" maxWidth="2xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition cursor-pointer',
                  activeTab === 'gallery'
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                )}
              >
                Media Gallery
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer',
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                )}
              >
                <Upload className="w-3.5 h-3.5" /> Upload New
              </button>
            </div>
          </div>

          {activeTab === 'gallery' ? (
            <div>
              {isLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : mediaList.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  No images in media library. Upload one in the &quot;Upload New&quot; tab.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1 custom-scrollbar">
                  {mediaList.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleSelect(m.url)}
                      className={cn(
                        'relative aspect-square rounded-xl border-2 overflow-hidden cursor-pointer group transition-all bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center',
                        value === m.url
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                      )}
                    >
                      <img
                        src={m.url}
                        alt={m.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {value === m.url && (
                        <div className="absolute top-1.5 right-1.5 bg-indigo-600 text-white rounded-full p-1 shadow-sm">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] p-1.5 truncate opacity-0 group-hover:opacity-100 transition">
                        {m.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-2">
              <FileUploader
                onUploadSuccess={(newMedia) => {
                  loadMedia();
                  handleSelect(newMedia.url);
                }}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
