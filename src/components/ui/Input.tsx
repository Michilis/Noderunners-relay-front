import React from 'react';
import { cn } from './cn';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Monospaced text field on the theme-aware input surface.
 * Focus state is a plain orange border — no glow (see DESIGN.md).
 */
export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full px-4 py-3 bg-input border border-surface-variant rounded',
        'font-mono text-label-mono text-on-surface placeholder:text-surface-bright',
        'transition-colors focus:outline-none focus:border-primary-container',
        className,
      )}
      {...props}
    />
  );
}
