'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, X, FileIcon } from 'lucide-react';
import { mediaService } from '@/services/mediaService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { MediaItem } from '@/types/media';

export interface FileUploaderProps {
  onUploadSuccess?: (media: MediaItem | MediaItem[]) => void;
  multiple?: boolean;
}

const MAX_BYTES = 20 * 1024 * 1024;

export function FileUploader({ onUploadSuccess, multiple = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const acceptFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    const valid: File[] = [];

    for (const file of incoming) {
      if (file.size > MAX_BYTES) {
        toast.error('File too large', `${file.name} exceeds the 20MB limit.`);
        continue;
      }
      valid.push(file);
    }

    if (!valid.length) return;
    setSelectedFiles(multiple ? valid : [valid[0]]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) acceptFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) acceptFiles(e.target.files);
    e.target.value = '';
  };

  const uploadFiles = async () => {
    if (!selectedFiles.length) return;

    setIsUploading(true);
    try {
      if (selectedFiles.length === 1) {
        const res = await mediaService.uploadMedia(selectedFiles[0]);
        toast.success('Upload successful', `${selectedFiles[0].name} was uploaded.`);
        setSelectedFiles([]);
        onUploadSuccess?.(res.data);
      } else {
        const res = await mediaService.uploadMultipleMedia(selectedFiles);
        toast.success('Upload successful', `${selectedFiles.length} files uploaded.`);
        setSelectedFiles([]);
        onUploadSuccess?.(res.data);
      }
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || 'Failed to upload file.';
      toast.error('Upload failed', errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-muted/30 hover:border-muted-foreground/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.zip,video/mp4"
        />
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UploadCloud className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Click to upload <span className="font-normal text-muted-foreground">or drag and drop</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PNG, JPG, WEBP, PDF, DOCX, MP4 up to 20MB{multiple ? ' · multiple files allowed' : ''}
        </p>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-3.5 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3 overflow-hidden">
                <FileIcon className="h-5 w-5 shrink-0 text-primary" />
                <div className="truncate">
                  <p className="truncate text-xs font-medium text-foreground">{file.name}</p>
                  <p className="text-[11px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSelectedFiles((prev) => prev.filter((f) => f !== file))
                }
                className="p-1 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex justify-end">
            <Button size="sm" onClick={uploadFiles} isLoading={isUploading}>
              Upload {selectedFiles.length > 1 ? `${selectedFiles.length} files` : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
