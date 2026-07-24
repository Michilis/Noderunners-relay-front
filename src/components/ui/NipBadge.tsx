import React from 'react';

/** Small mono badge for a supported NIP number. */
export function NipBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 bg-surface-container border border-surface-variant rounded font-mono text-label-sm-mono text-on-surface">
      {children}
    </span>
  );
}
