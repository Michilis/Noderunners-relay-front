import React, { useRef } from 'react';
import { cn } from '../ui/cn';
import { NoteCard } from './NoteCard';
import { FeedSkeleton } from './FeedSkeleton';
import { useTranslation } from '../../i18n';
import type { LiveFeedStatus } from '../../hooks/useLiveFeed';
import type { FeedNote, NostrProfile } from '../../services/nostr';

interface LiveFeedPanelProps {
  notes: FeedNote[];
  profiles: Map<string, NostrProfile>;
  status: LiveFeedStatus;
}

/**
 * The live kind-1 stream rendered as a terminal log — the panel keeps the
 * always-dark terminal identity in both themes, like TerminalPanel. Fixed
 * viewport height so streaming never shifts the page.
 */
export function LiveFeedPanel({ notes, profiles, status }: LiveFeedPanelProps) {
  const { t } = useTranslation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const live = status === 'live';

  return (
    <div className="terminal-panel rounded overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border">
        <span className="font-mono text-label-mono uppercase tracking-widest text-terminal-muted">
          {t('home.feed.liveTitle')}
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              live ? 'bg-terminal-green animate-pulse' : 'bg-status-warning',
              status === 'error' && 'bg-status-error animate-none',
            )}
          />
          <span
            className={cn(
              'font-mono text-label-sm-mono uppercase tracking-wider',
              live ? 'text-terminal-green' : 'text-terminal-muted',
            )}
          >
            {live ? t('home.feed.live') : t('home.feed.connecting')}
          </span>
        </span>
      </div>

      <div ref={viewportRef} className="h-[480px] overflow-y-auto overscroll-contain">
        {notes.length > 0 ? (
          <div className="divide-y divide-terminal-border">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                profile={profiles.get(note.pubkey)}
                variant="terminal"
                className="animate-fade-in"
              />
            ))}
          </div>
        ) : status === 'connecting' ? (
          <FeedSkeleton rows={6} variant="terminal" />
        ) : (
          <p className="p-6 font-mono text-label-mono text-terminal-muted">
            {status === 'error' ? t('home.feed.unavailable') : t('home.feed.empty')}
          </p>
        )}
      </div>
    </div>
  );
}
