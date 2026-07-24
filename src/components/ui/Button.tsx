import React from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'outline' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded font-mono text-label-mono font-medium select-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary:
    'bg-primary-container text-white font-bold hover:brightness-110 active:brightness-95',
  outline:
    'border border-outline-variant text-on-surface hover:bg-surface-container hover:border-outline active:bg-surface-container-high',
  secondary:
    'bg-surface-container-high text-on-surface border border-surface-variant hover:bg-surface-container-highest active:bg-surface-container',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2',
  md: 'px-6 py-3',
  lg: 'px-8 py-3.5 text-body-md',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
