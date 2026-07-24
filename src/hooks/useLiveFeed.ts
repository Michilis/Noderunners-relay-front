import { useEffect, useRef, useState } from 'react';
import type { NDKEvent } from '@nostr-dev-kit/ndk';
import {
  openLiveSubscription,
  resolveProfiles,
  toFeedNote,
  type FeedNote,
  type NostrProfile,
} from '../services/nostr';

export type LiveFeedStatus = 'connecting' | 'live' | 'error';

interface UseLiveFeedResult {
  notes: FeedNote[];
  profiles: Map<string, NostrProfile>;
  status: LiveFeedStatus;
}

const FLUSH_INTERVAL_MS = 1000;
const CONNECT_TIMEOUT_MS = 8000;

/**
 * Live kind-1 stream from the relay. Incoming events are buffered and flushed
 * to state at most once per second so a busy relay can't cause render storms.
 * Does nothing until `enabled` is true (the section defers until scrolled near).
 */
export function useLiveFeed(enabled: boolean, limit = 25): UseLiveFeedResult {
  const [notes, setNotes] = useState<FeedNote[]>([]);
  const [profiles, setProfiles] = useState<Map<string, NostrProfile>>(new Map());
  const [status, setStatus] = useState<LiveFeedStatus>('connecting');
  const pendingRef = useRef<NDKEvent[]>([]);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let stop: (() => void) | null = null;

    const flush = () => {
      if (disposed || pendingRef.current.length === 0) return;
      const fresh = pendingRef.current
        .filter((ev) => ev.content.trim() !== '')
        .map(toFeedNote);
      pendingRef.current = [];
      if (fresh.length === 0) return;

      setStatus('live');
      setNotes((prev) =>
        [...fresh, ...prev].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit),
      );

      void resolveProfiles(fresh.map((n) => n.pubkey)).then((resolved) => {
        if (disposed || resolved.size === 0) return;
        setProfiles((prev) => new Map([...prev, ...resolved]));
      });
    };

    const flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
    // If nothing arrived (relay down, CORS, offline) surface the degraded state.
    const connectTimer = setTimeout(() => {
      if (!disposed && seenRef.current.size === 0) setStatus('error');
    }, CONNECT_TIMEOUT_MS);

    void openLiveSubscription(
      { kinds: [1], limit },
      {
        onEvent: (event) => {
          if (disposed || seenRef.current.has(event.id)) return;
          seenRef.current.add(event.id);
          pendingRef.current.push(event);
        },
        onEose: flush,
      },
    )
      .then((stopFn) => {
        if (disposed) stopFn();
        else stop = stopFn;
      })
      .catch(() => {
        if (!disposed) setStatus('error');
      });

    return () => {
      disposed = true;
      clearInterval(flushTimer);
      clearTimeout(connectTimer);
      stop?.();
    };
  }, [enabled, limit]);

  return { notes, profiles, status };
}
