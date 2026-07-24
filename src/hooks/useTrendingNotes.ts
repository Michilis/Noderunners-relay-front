import { useEffect, useState } from 'react';
import {
  fetchTrendingNotes,
  resolveProfiles,
  type NostrProfile,
  type TrendingNote,
} from '../services/nostr';

interface UseTrendingNotesResult {
  notes: TrendingNote[];
  profiles: Map<string, NostrProfile>;
  loading: boolean;
}

const REFRESH_INTERVAL_MS = 60_000;

/**
 * Notes on the relay ranked by engagement (zaps, reposts, reactions) over the
 * last `windowHours`. Recomputed every minute while mounted. Does nothing
 * until `enabled` is true.
 */
export function useTrendingNotes(
  enabled: boolean,
  windowHours = 48,
  count = 5,
): UseTrendingNotesResult {
  const [notes, setNotes] = useState<TrendingNote[]>([]);
  const [profiles, setProfiles] = useState<Map<string, NostrProfile>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;

    const refresh = async () => {
      try {
        const trending = await fetchTrendingNotes(windowHours, count);
        if (disposed) return;
        setNotes(trending);
        const resolved = await resolveProfiles(trending.map((n) => n.pubkey));
        if (!disposed) setProfiles((prev) => new Map([...prev, ...resolved]));
      } catch {
        /* relay unreachable — keep whatever we had; empty state handles the rest */
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    void refresh();
    const timer = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);

    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [enabled, windowHours, count]);

  return { notes, profiles, loading };
}
