import React from 'react';
import { Copy } from 'lucide-react';
import { cn } from './cn';

interface TerminalPanelProps {
  /** Monospaced content, e.g. a relay URL or Lightning invoice. */
  value: string;
  /** Show a copy affordance and call this when the panel is clicked/copied. */
  onCopy?: (value: string) => void;
  /** Colour of the code text — success green reads as a live endpoint. */
  tone?: 'success' | 'default';
  /** Allow the value to wrap instead of scrolling horizontally. */
  wrap?: boolean;
  className?: string;
}

/** Terminal-style readout panel (#0D0D0D, inset shadow) for data strings. */
export function TerminalPanel({
  value,
  onCopy,
  tone = 'success',
  wrap = false,
  className,
}: TerminalPanelProps) {
  const clickable = Boolean(onCopy);
  return (
    <div
      className={cn(
        'terminal-panel p-4 rounded flex items-center justify-between gap-4 group relative',
        clickable && 'cursor-pointer',
        className,
      )}
      onClick={onCopy ? () => onCopy(value) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        onCopy
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onCopy(value);
              }
            }
          : undefined
      }
    >
      <code
        className={cn(
          'font-mono text-label-mono relative z-10 select-all',
          wrap ? 'break-all' : 'overflow-x-auto whitespace-nowrap',
          tone === 'success' ? 'text-terminal-green' : 'text-terminal-fg',
        )}
      >
        {value}
      </code>
      {onCopy ? (
        <Copy className="h-5 w-5 flex-shrink-0 text-terminal-muted group-hover:text-terminal-accent transition-colors relative z-10" />
      ) : null}
    </div>
  );
}
