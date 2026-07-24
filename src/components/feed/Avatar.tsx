import React, { useState } from 'react';
import { cn } from '../ui/cn';
import type { NostrProfile } from '../../services/nostr';

interface AvatarProps {
  profile?: NostrProfile;
  size?: 'sm' | 'lg';
  className?: string;
}

const sizeClass = { sm: 'h-9 w-9', lg: 'h-12 w-12' };

/**
 * Profile picture with a deterministic on-brand fallback: a mono initial tile
 * when the picture is missing or fails to load. Fixed dimensions → no layout
 * shift while images resolve.
 */
export function Avatar({ profile, size = 'sm', className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const picture = !failed ? profile?.picture : undefined;
  const initial = (profile?.name ?? 'n').replace(/^npub1/, '').charAt(0).toUpperCase();

  if (picture) {
    return (
      <img
        src={picture}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn(
          'rounded object-cover border border-surface-variant flex-shrink-0 bg-surface-container-high',
          sizeClass[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded border border-surface-variant flex-shrink-0 bg-surface-container-high',
        'flex items-center justify-center font-mono text-primary select-none',
        size === 'lg' ? 'text-body-lg' : 'text-label-mono',
        sizeClass[size],
        className,
      )}
    >
      {initial}
    </div>
  );
}
