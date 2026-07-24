import React from 'react';
import { cn } from '../ui/cn';

interface FeedSkeletonProps {
  rows?: number;
  variant?: 'terminal' | 'surface';
}

/** Pulsing placeholder rows with the same dimensions as real NoteCard rows, so
 * loading reserves space and streaming causes no layout shift. */
export function FeedSkeleton({ rows = 5, variant = 'surface' }: FeedSkeletonProps) {
  const bar = variant === 'terminal' ? 'bg-terminal-border' : 'bg-surface-container-high';
  return (
    <div className="animate-pulse" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3 p-4">
          <div className={cn('h-9 w-9 rounded flex-shrink-0', bar)} />
          <div className="min-w-0 flex-1 space-y-2 py-0.5">
            <div className="flex justify-between gap-3">
              <div className={cn('h-3.5 w-32 rounded', bar)} />
              <div className={cn('h-3 w-12 rounded', bar)} />
            </div>
            <div className={cn('h-3.5 w-full rounded', bar)} />
            <div className={cn('h-3.5 w-2/3 rounded', bar)} />
          </div>
        </div>
      ))}
    </div>
  );
}
