'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Upload, Check, X } from 'lucide-react';
import { mediaService } from '@/services/mediaService';
import { MediaItem } from '@/types/media';
import { Modal } from './Modal';
import { FileUploader } from './FileUploader';
import { Button } from '@/components/ui/Button';

export interface ImagePickerProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
}

export function ImagePicker({ value, onChange, label = 'Select Image' }: ImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</label>}
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 group">
            <img src={value} alt="Selected" className="w-full h-full object-cover" />
            <button
              onClick={() => onChange('')}
              className="absolute top-1 right-1 bg-black/60 hover:bg-black text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition"
              title="Remove image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-800/50 shrink-0">
            <ImageIcon className="w-6 h-6" />
          </div>
        )}
        <div className="flex flex-col gap-1.5 flex-1">
          <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="w-fit text-xs">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Choose from Media
          </Button>
          {value && <p className="text-[11px] text-gray-400 truncate max-w-xs">{value}</p>}
        </div>
      </div>

      {/* Media Picker Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Select Media Image" maxWidth="2xl">
        <div className="space-y-4">
          <div className="flex border-b border-gray-200 dark:border-gray-800 pb-2 gap-4 text-sm font-medium">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`pb-2 border-b-2 transition ${
                activeTab === 'gallery'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Media Gallery
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`pb-2 border-b-2 transition ${
                activeTab === 'upload'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Upload New
            </button>
          </div>

          {activeTab === 'gallery' ? (
            <div>
              {isLoading ? (
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : mediaList.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-400">
                  No images in media library. Upload one below.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
                  {mediaList.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => handleSelect(m.url)}
                      className={`relative aspect-square rounded-lg border overflow-hidden cursor-pointer group transition hover:border-indigo-500 ${
                        value === m.url
                          ? 'ring-2 ring-indigo-500 border-transparent'
                          : 'border-gray-200 dark:border-gray-800'
                      }`}
                    >
                      <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                      {value === m.url && (
                        <div className="absolute top-1.5 right-1.5 bg-indigo-600 text-white rounded-full p-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] p-1 truncate opacity-0 group-hover:opacity-100 transition">
                        {m.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <FileUploader
              onUploadSuccess={(newMedia) => {
                loadMedia();
                handleSelect(newMedia.url);
              }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
