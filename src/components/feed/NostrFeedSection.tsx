import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveFeed } from '../../hooks/useLiveFeed';
import { useTrendingNotes } from '../../hooks/useTrendingNotes';
import { useTranslation } from '../../i18n';
import { LiveFeedPanel } from './LiveFeedPanel';
import { TrendingPanel } from './TrendingPanel';
import { SpotlightCard } from './SpotlightCard';
import type { FeedNote } from '../../services/nostr';

/** The 3 most recent notes from 3 distinct authors — the whitelist spotlight
 * (only whitelisted keys can write to the relay). */
function pickSpotlight(notes: FeedNote[]): FeedNote[] {
  const picked: FeedNote[] = [];
  const authors = new Set<string>();
  for (const note of notes) {
    if (authors.has(note.pubkey)) continue;
    authors.add(note.pubkey);
    picked.push(note);
    if (picked.length === 3) break;
  }
  return picked;
}

/**
 * Live activity section: whitelist spotlight row, live terminal feed and
 * trending panel. Relay connections are deferred until the section is
 * scrolled near, so the landing page's initial load is untouched.
 */
export function NostrFeedSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setActive(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const live = useLiveFeed(active);
  const trending = useTrendingNotes(active);

  // Cheap re-render tick so relative timestamps don't go stale on a quiet relay.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(timer);
  }, [active]);

  const spotlight = useMemo(() => pickSpotlight(live.notes), [live.notes]);

  // Relay unreachable and nothing to show — collapse to a single quiet line
  // instead of a wall of broken panels.
  const unavailable =
    live.status === 'error' && trending.notes.length === 0 && !trending.loading;

  return (
    <section id="feed" ref={sectionRef} className="space-y-8 scroll-mt-24">
      <div className="text-center">
        <h2 className="font-display text-headline-lg font-semibold text-on-surface">
          {t('home.feed.title')}
        </h2>
        <p className="text-secondary font-body text-body-md mt-2">{t('home.feed.subtitle')}</p>
      </div>

      {unavailable ? (
        <p className="text-center font-mono text-label-sm-mono text-secondary">
          {t('home.feed.unavailable')}
        </p>
      ) : (
        <>
          {spotlight.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-mono text-label-mono text-secondary uppercase tracking-widest text-center">
                {t('home.feed.spotlightTitle')}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {spotlight.map((note, i) => (
                  <SpotlightCard
                    key={note.id}
                    note={note}
                    profile={live.profiles.get(note.pubkey)}
                    index={i}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-4 items-start">
            <div className="order-2 lg:order-1">
              <LiveFeedPanel notes={live.notes} profiles={live.profiles} status={live.status} />
            </div>
            <div className="order-1 lg:order-2">
              <TrendingPanel
                notes={trending.notes}
                profiles={trending.profiles}
                loading={trending.loading}
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
