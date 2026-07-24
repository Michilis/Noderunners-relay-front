import React from 'react';
import { cn } from './cn';

type Tone = 'success' | 'warning' | 'error';

interface StatusChipProps {
  tone?: Tone;
  /** Pulse the dot to signal live/active status. */
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}

const dotTone: Record<Tone, string> = {
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
};

/** Small monospaced label with a coloured status dot. */
export function StatusChip({ tone = 'success', pulse, className, children }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full border border-outline-variant bg-surface-container-high',
        className,
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', dotTone[tone], pulse && 'animate-pulse')} />
      <span className="font-mono text-label-sm-mono text-secondary">{children}</span>
    </span>
  );
}
