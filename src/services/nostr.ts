/**
 * Live Nostr feed service — a thin wrapper around NDK.
 *
 * NDK is loaded via dynamic import so the websocket stack stays out of the
 * initial bundle; the feed section sits below the fold and only connects once
 * scrolled near.
 *
 * Feed queries are pinned to the Noderunners relay (`exclusiveRelay`) — the
 * section shows what happens *on this relay*, and since only whitelisted keys
 * can write to it, every stored note is from a whitelisted user. Profile
 * (kind-0) lookups additionally query purplepag.es, the de-facto profile
 * relay, because not every author publishes their metadata to a community
 * relay.
 */
import type NDK from '@nostr-dev-kit/ndk';
import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';

export const RELAY_URL = (import.meta.env.VITE_NOSTR_RELAY_URL ?? '').trim();
const PROFILE_RELAY_URL = 'wss://purplepag.es';

export interface FeedNote {
  id: string;
  pubkey: string;
  content: string;
  /** Unix seconds. */
  createdAt: number;
  /** Outbound link to the note on njump.me. */
  link: string;
}

export interface TrendingNote extends FeedNote {
  zaps: number;
  reactions: number;
  reposts: number;
  score: number;
}

export interface NostrProfile {
  /** Best available display name; a truncated npub when nothing else exists. */
  name: string;
  picture?: string;
  nip05?: string;
  /** True when `name` is just the truncated npub (no kind-0 found). */
  fallback: boolean;
}

let ndkPromise: Promise<NDK> | null = null;

/** Lazily create, connect and memoise the NDK singleton. */
function getNdk(): Promise<NDK> {
  if (!ndkPromise) {
    ndkPromise = (async () => {
      const { default: NDKCtor } = await import('@nostr-dev-kit/ndk');
      const ndk = new NDKCtor({
        explicitRelayUrls: [RELAY_URL, PROFILE_RELAY_URL].filter(Boolean),
      });
      await ndk.connect();
      return ndk;
    })();
  }
  return ndkPromise;
}

export function toFeedNote(event: NDKEvent): FeedNote {
  return {
    id: event.id,
    pubkey: event.pubkey,
    content: event.content,
    createdAt: event.created_at ?? 0,
    link: `https://njump.me/${event.encode()}`,
  };
}

/**
 * Open a live subscription on the Noderunners relay only. Resolves to a stop
 * function once the connection is set up.
 */
export async function openLiveSubscription(
  filters: NDKFilter | NDKFilter[],
  handlers: { onEvent: (event: NDKEvent) => void; onEose?: () => void },
): Promise<() => void> {
  const ndk = await getNdk();
  const sub = ndk.subscribe(filters, {
    closeOnEose: false,
    relayUrls: [RELAY_URL],
    exclusiveRelay: true,
    onEvent: handlers.onEvent,
    onEose: handlers.onEose,
  });
  return () => sub.stop();
}

/** One-shot fetch pinned to the Noderunners relay. */
export async function fetchRelayEvents(filters: NDKFilter | NDKFilter[]): Promise<NDKEvent[]> {
  const ndk = await getNdk();
  const { NDKRelaySet } = await import('@nostr-dev-kit/ndk');
  const relaySet = NDKRelaySet.fromRelayUrls([RELAY_URL], ndk);
  const events = await ndk.fetchEvents(filters, { closeOnEose: true }, relaySet);
  return [...events];
}

function truncatedNpub(ndk: NDK, pubkey: string): string {
  try {
    const npub = ndk.getUser({ pubkey }).npub;
    return `${npub.slice(0, 12)}…${npub.slice(-4)}`;
  } catch {
    return `${pubkey.slice(0, 12)}…`;
  }
}

// Module-level profile cache: resolved entries plus in-flight dedupe, shared
// by every hook so a pubkey is fetched at most once per page load.
const profileCache = new Map<string, NostrProfile>();
const profilePending = new Map<string, Promise<void>>();

/**
 * Resolve kind-0 metadata for a set of pubkeys (batched, cached). The returned
 * map always has an entry per requested pubkey — a truncated-npub fallback
 * when no profile exists anywhere.
 */
export async function resolveProfiles(pubkeys: string[]): Promise<Map<string, NostrProfile>> {
  const unique = [...new Set(pubkeys)];
  const missing = unique.filter((pk) => !profileCache.has(pk) && !profilePending.has(pk));

  if (missing.length > 0) {
    const fetchBatch = (async () => {
      const ndk = await getNdk();
      const { profileFromEvent } = await import('@nostr-dev-kit/ndk');
      // Query both relays (community + purplepag.es); keep newest kind-0 per key.
      const events = await ndk.fetchEvents({ kinds: [0], authors: missing }, { closeOnEose: true });
      const newest = new Map<string, NDKEvent>();
      for (const ev of events) {
        const prev = newest.get(ev.pubkey);
        if (!prev || (ev.created_at ?? 0) > (prev.created_at ?? 0)) newest.set(ev.pubkey, ev);
      }
      for (const pk of missing) {
        const ev = newest.get(pk);
        if (ev) {
          try {
            const p = profileFromEvent(ev);
            const name = p.displayName?.trim() || p.name?.trim() || p.nip05?.trim();
            profileCache.set(pk, {
              name: name || truncatedNpub(ndk, pk),
              picture: p.picture || p.image,
              nip05: p.nip05,
              fallback: !name,
            });
            continue;
          } catch {
            /* malformed kind-0 content — fall through to npub */
          }
        }
        profileCache.set(pk, { name: truncatedNpub(ndk, pk), fallback: true });
      }
    })().finally(() => {
      for (const pk of missing) profilePending.delete(pk);
    });
    for (const pk of missing) profilePending.set(pk, fetchBatch);
  }

  await Promise.all(unique.map((pk) => profilePending.get(pk)).filter(Boolean));

  const result = new Map<string, NostrProfile>();
  for (const pk of unique) {
    const profile = profileCache.get(pk);
    if (profile) result.set(pk, profile);
  }
  return result;
}

/** NIP-25/18/57 convention: the referenced note is the *last* `e` tag. */
function referencedNoteId(event: NDKEvent): string | undefined {
  const eTags = event.tags.filter((t) => t[0] === 'e');
  return eTags[eTags.length - 1]?.[1];
}

/**
 * Rank notes on the relay by engagement (zaps, reposts, reactions) over the
 * given window. Returns at most `count` notes, highest score first.
 */
export async function fetchTrendingNotes(windowHours: number, count: number): Promise<TrendingNote[]> {
  const since = Math.floor(Date.now() / 1000) - windowHours * 3600;
  const engagement = await fetchRelayEvents({ kinds: [6, 7, 9735], since, limit: 500 });

  const tally = new Map<string, { zaps: number; reactions: number; reposts: number }>();
  for (const ev of engagement) {
    const target = referencedNoteId(ev);
    if (!target) continue;
    const t = tally.get(target) ?? { zaps: 0, reactions: 0, reposts: 0 };
    if (ev.kind === 9735) t.zaps += 1;
    else if (ev.kind === 6) t.reposts += 1;
    else t.reactions += 1;
    tally.set(target, t);
  }

  const score = (t: { zaps: number; reactions: number; reposts: number }) =>
    t.zaps * 3 + t.reposts * 2 + t.reactions;

  // Fetch more candidates than needed — some ids may not resolve to a kind-1
  // note stored on this relay.
  const candidates = [...tally.entries()]
    .sort((a, b) => score(b[1]) - score(a[1]))
    .slice(0, count * 3);
  if (candidates.length === 0) return [];

  const noteEvents = await fetchRelayEvents({ kinds: [1], ids: candidates.map(([id]) => id) });
  const byId = new Map(noteEvents.map((ev) => [ev.id, ev]));

  const trending: TrendingNote[] = [];
  for (const [id, t] of candidates) {
    const ev = byId.get(id);
    if (!ev) continue;
    trending.push({ ...toFeedNote(ev), ...t, score: score(t) });
    if (trending.length >= count) break;
  }
  return trending;
}
