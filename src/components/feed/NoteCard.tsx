import React from 'react';
import { cn } from '../ui/cn';
import { Avatar } from './Avatar';
import { formatAbsoluteTime, formatRelativeTime } from './relativeTime';
import { splitMedia } from './media';
import { useTranslation } from '../../i18n';
import type { FeedNote, NostrProfile } from '../../services/nostr';

interface NoteCardProps {
  note: FeedNote;
  profile?: NostrProfile;
  /** 'terminal' rows live inside the always-dark terminal panel; 'surface'
   * rows sit on theme-aware surfaces. */
  variant?: 'terminal' | 'surface';
  /** Content line clamp. */
  clamp?: 2 | 3 | 4;
  className?: string;
}

const clampClass = { 2: 'line-clamp-2', 3: 'line-clamp-3', 4: 'line-clamp-4' };

/** One feed row: avatar, author, relative timestamp, clamped plain-text
 * content. The whole row links out to the note on njump. */
export function NoteCard({ note, profile, variant = 'surface', clamp = 4, className }: NoteCardProps) {
  const { t, lang } = useTranslation();
  const terminal = variant === 'terminal';
  const { text, mediaCount } = splitMedia(note.content);

  return (
    <a
      href={note.link}
      target="_blank"
      rel="noopener noreferrer"
      title={t('home.feed.viewNote')}
      className={cn(
        'flex gap-3 p-4 transition-colors',
        terminal ? 'hover:bg-white/5' : 'hover:bg-surface-container rounded',
        className,
      )}
    >
      <Avatar profile={profile} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <span
            className={cn(
              'font-body text-body-md font-semibold truncate',
              terminal ? 'text-terminal-fg' : 'text-on-surface',
              profile?.fallback && 'font-mono text-label-mono font-medium',
            )}
          >
            {profile?.name ?? '…'}
          </span>
          <time
            className={cn(
              'font-mono text-label-sm-mono flex-shrink-0',
              terminal ? 'text-terminal-muted' : 'text-secondary',
            )}
            title={formatAbsoluteTime(note.createdAt, lang)}
            dateTime={new Date(note.createdAt * 1000).toISOString()}
          >
            {formatRelativeTime(note.createdAt, lang)}
          </time>
        </div>
        {profile?.nip05 && !profile.fallback ? (
          <p
            className={cn(
              'font-mono text-label-sm-mono truncate',
              terminal ? 'text-terminal-muted' : 'text-secondary',
            )}
          >
            {profile.nip05}
          </p>
        ) : null}
        {text ? (
          <p
            className={cn(
              'font-body text-body-md break-words whitespace-pre-line',
              clampClass[clamp],
              terminal ? 'text-terminal-fg/90' : 'text-on-surface',
            )}
          >
            {text}
          </p>
        ) : null}
        {mediaCount > 0 ? (
          <span
            className={cn(
              'inline-block font-mono text-label-sm-mono uppercase tracking-wider px-1.5 py-0.5 rounded border',
              terminal
                ? 'text-terminal-accent border-terminal-border'
                : 'text-primary border-surface-variant',
            )}
          >
            {t('home.feed.mediaChip')}
            {mediaCount > 1 ? ` ×${mediaCount}` : ''}
          </span>
        ) : null}
      </div>
    </a>
  );
}
