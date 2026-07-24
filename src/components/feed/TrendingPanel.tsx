import React from 'react';
import { Zap, Heart, Repeat2, TrendingUp } from 'lucide-react';
import { Card } from '../ui';
import { NoteCard } from './NoteCard';
import { FeedSkeleton } from './FeedSkeleton';
import { useTranslation } from '../../i18n';
import type { NostrProfile, TrendingNote } from '../../services/nostr';

interface TrendingPanelProps {
  notes: TrendingNote[];
  profiles: Map<string, NostrProfile>;
  loading: boolean;
}

function EngagementStat({
  icon: Icon,
  count,
  label,
}: {
  icon: typeof Zap;
  count: number;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-label-sm-mono text-secondary"
      title={label}
      aria-label={`${count} ${label}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {count}
    </span>
  );
}

/** Relay notes ranked by engagement (zaps, reposts, reactions) over the last
 * 48 hours. */
export function TrendingPanel({ notes, profiles, loading }: TrendingPanelProps) {
  const { t } = useTranslation();

  return (
    <Card elevated className="overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-variant">
        <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-mono text-label-mono uppercase tracking-widest text-secondary">
          {t('home.feed.trendingTitle')}
        </span>
      </div>

      {notes.length > 0 ? (
        <ol className="divide-y divide-surface-variant">
          {notes.map((note, i) => (
            <li key={note.id} className="flex gap-1 pl-4">
              <span className="font-mono text-label-mono font-bold text-primary pt-4 select-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <NoteCard note={note} profile={profiles.get(note.pubkey)} clamp={2} />
                <div className="flex gap-4 px-4 pb-4 -mt-1">
                  <EngagementStat icon={Zap} count={note.zaps} label={t('home.feed.zaps')} />
                  <EngagementStat icon={Heart} count={note.reactions} label={t('home.feed.reactions')} />
                  <EngagementStat icon={Repeat2} count={note.reposts} label={t('home.feed.reposts')} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : loading ? (
        <FeedSkeleton rows={4} />
      ) : (
        <p className="p-6 font-body text-body-md text-secondary">{t('home.feed.trendingEmpty')}</p>
      )}
    </Card>
  );
}
