'use client';

import React from 'react';
import { Globe, Share2, Search } from 'lucide-react';

export interface SeoPreviewProps {
  title: string;
  description: string;
  url: string;
  image?: string;
  brandName?: string;
}

export function SeoPreview({
  title,
  description,
  url,
  image,
  brandName = 'My Application',
}: SeoPreviewProps) {
  const displayUrl = url || 'https://yourdomain.com';
  const displayTitle = title || 'Your Page Title | ' + brandName;
  const displayDesc =
    description || 'Provide a compelling description that accurately summarizes your page content for search engines.';

  return (
    <div className="space-y-6">
      {/* Google Search Snippet Preview */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5 text-primary" /> Google Search Result Preview
        </div>
        <div className="p-4 bg-white dark:bg-zinc-950 rounded-xl border border-border space-y-1 font-sans">
          <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <Globe className="h-3.5 w-3.5 text-zinc-400" />
            <span className="truncate max-w-sm">{displayUrl}</span>
          </div>
          <div className="text-base font-medium text-blue-700 dark:text-blue-400 hover:underline cursor-pointer truncate">
            {displayTitle}
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {displayDesc}
          </div>
        </div>
      </div>

      {/* Social Media Share Preview */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Share2 className="h-3.5 w-3.5 text-primary" /> Social Card / OpenGraph Share Preview
        </div>
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-border overflow-hidden max-w-md shadow-xs">
          {image ? (
            <div className="h-44 w-full bg-muted relative overflow-hidden border-b border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="OG Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-36 w-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center border-b border-border text-xs text-muted-foreground">
              No Social Image Assigned (Default fallback will apply)
            </div>
          )}

          <div className="p-3.5 space-y-1">
            <div className="text-[11px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 truncate">
              {displayUrl.replace(/^https?:\/\//, '')}
            </div>
            <div className="text-sm font-semibold text-foreground line-clamp-1">{displayTitle}</div>
            <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{displayDesc}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
