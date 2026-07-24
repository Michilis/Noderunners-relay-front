import React from 'react';
import { Card } from '../ui';
import { Avatar } from './Avatar';
import { formatAbsoluteTime, formatRelativeTime } from './relativeTime';
import { splitMedia } from './media';
import { useTranslation } from '../../i18n';
import type { FeedNote, NostrProfile } from '../../services/nostr';

interface SpotlightCardProps {
  note: FeedNote;
  profile?: NostrProfile;
  /** Position in the row — staggers the entrance animation. */
  index: number;
}

/** Featured note from a whitelisted user — mirrors the accented tier card so
 * the row visually rhymes with Access Tiers directly above it. */
export function SpotlightCard({ note, profile, index }: SpotlightCardProps) {
  const { t, lang } = useTranslation();
  const { text, mediaCount } = splitMedia(note.content);

  return (
    <a
      href={note.link}
      target="_blank"
      rel="noopener noreferrer"
      title={t('home.feed.viewNote')}
      className="block animate-fade-in [animation-fill-mode:backwards]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Card
        elevated
        className="relative h-full p-6 flex flex-col gap-4 transition-colors hover:border-primary"
      >
        <div className="absolute top-4 right-4 px-2 py-0.5 border border-primary rounded font-mono text-label-sm-mono uppercase tracking-wider text-primary">
          {t('home.feed.spotlightBadge')}
        </div>
        <div className="flex items-center gap-3 pr-24">
          <Avatar profile={profile} size="lg" />
          <div className="min-w-0">
            <p className="font-body text-body-md font-semibold text-on-surface truncate">
              {profile?.name ?? '…'}
            </p>
            <p className="font-mono text-label-sm-mono text-secondary truncate">
              {profile?.nip05 && !profile.fallback ? profile.nip05 : ''}
            </p>
          </div>
        </div>
        <p className="font-body text-body-md text-on-surface break-words whitespace-pre-line line-clamp-3 flex-grow">
          {text || (mediaCount > 0 ? `[${t('home.feed.mediaChip')}]` : '')}
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-surface-variant">
          <time
            className="font-mono text-label-sm-mono text-secondary"
            title={formatAbsoluteTime(note.createdAt, lang)}
            dateTime={new Date(note.createdAt * 1000).toISOString()}
          >
            {formatRelativeTime(note.createdAt, lang)}
          </time>
          <span className="font-mono text-label-sm-mono text-primary uppercase tracking-wider">
            {t('home.feed.viewNote')} →
          </span>
        </div>
      </Card>
    </a>
  );
}
