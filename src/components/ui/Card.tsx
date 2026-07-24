import React from 'react';
import { cn } from './cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slightly brighter surface + stronger border for emphasised panels. */
  elevated?: boolean;
  /** Highlight with the primary orange border (e.g. recommended tier). */
  accent?: boolean;
}

/** Tonal surface panel with a 1px border — the wireframe-adjacent industrial look. */
export function Card({ elevated, accent, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded',
        elevated
          ? 'bg-surface-container-high border border-outline-variant'
          : 'bg-surface-container-low border border-surface-variant',
        accent && 'border-2 border-primary',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
