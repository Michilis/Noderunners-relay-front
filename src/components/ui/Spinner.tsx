import React from 'react';
import { cn } from './cn';

interface SpinnerProps {
  /** Wrap in a vertically centered block (the common full-page loading state). */
  page?: boolean;
  className?: string;
  label?: string;
}

/** Orange ring spinner used for page and panel loading states. */
export function Spinner({ page, className, label }: SpinnerProps) {
  const ring = (
    <div
      role="status"
      aria-label={label ?? 'Loading'}
      className={cn(
        'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-container',
        className,
      )}
    />
  );

  if (!page) return ring;

  return <div className="flex justify-center items-center min-h-[400px]">{ring}</div>;
}
