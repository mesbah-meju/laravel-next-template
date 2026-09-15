'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileIcon } from 'lucide-react';
import { mediaService } from '@/services/mediaService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { MediaItem } from '@/types/media';

export interface FileUploaderProps {
  onUploadSuccess?: (media: MediaItem) => void;
  multiple?: boolean;
}

export function FileUploader({ onUploadSuccess, multiple = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large', 'Max file size is 20MB.');
      return;
    }
    setSelectedFile(file);
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const res = await mediaService.uploadMedia(selectedFile);
      toast.success('Upload Successful', `${selectedFile.name} was uploaded.`);
      setSelectedFile(null);
      if (onUploadSuccess) onUploadSuccess(res.data);
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || 'Failed to upload file.';
      toast.error('Upload Failed', errorMsg);
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
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 bg-gray-50/50 dark:bg-gray-800/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.zip"
        />
        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          Click to upload <span className="font-normal text-gray-500">or drag and drop</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, WEBP, PDF, DOCX up to 20MB</p>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between p-3.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileIcon className="w-5 h-5 text-indigo-500 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{selectedFile.name}</p>
              <p className="text-[11px] text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <Button size="sm" onClick={uploadFile} isLoading={isUploading}>
              Upload
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
