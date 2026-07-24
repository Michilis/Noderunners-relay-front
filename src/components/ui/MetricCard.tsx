import React from 'react';
import { cn } from './cn';

interface MetricCardProps {
  /** Uppercase mono label shown above the value. */
  label: string;
  /** Large value — a metric number or short phrase. */
  value: React.ReactNode;
  /** Optional unit rendered inline after the value (e.g. "ms", "ev/s"). */
  unit?: string;
  /** Optional small note beneath the value. */
  note?: string;
  /** 'lg' = large display numerals; 'md' = smaller headline for short phrases. */
  size?: 'lg' | 'md';
  className?: string;
}

/** Metric readout: uppercase label over a large value, hardware-panel style. */
export function MetricCard({ label, value, unit, note, size = 'lg', className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'bg-surface-container-low border border-surface-variant p-5 rounded flex flex-col justify-center gap-2',
        className,
      )}
    >
      <span className="font-mono text-label-sm-mono text-secondary uppercase tracking-widest">
        {label}
      </span>
      <span
        className={cn(
          'text-on-surface leading-tight',
          size === 'lg'
            ? 'font-display text-display font-bold'
            : 'font-display text-headline-md font-semibold',
        )}
      >
        {value}
        {unit ? <span className="text-headline-md text-primary ml-1">{unit}</span> : null}
      </span>
      {note ? <p className="font-mono text-label-sm-mono text-secondary">{note}</p> : null}
    </div>
  );
}
