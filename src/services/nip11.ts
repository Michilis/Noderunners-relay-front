/**
 * NIP-11 — Relay Information Document.
 *
 * Fetches metadata (supported NIPs, software, version, limits…) directly from
 * the relay over HTTP. The relay is queried at its own URL (the wss:// address
 * with the scheme swapped to https://) using the `application/nostr+json` Accept
 * header, per https://github.com/nostr-protocol/nips/blob/master/11.md
 *
 * Requires the relay to send permissive CORS headers for browser fetches
 * (strfry does by default). If it doesn't answer, callers get a graceful null.
 */

export interface RelayLimitation {
  max_message_length?: number;
  max_subscriptions?: number;
  max_limit?: number;
  max_subid_length?: number;
  max_event_tags?: number;
  max_content_length?: number;
  min_pow_difficulty?: number;
  auth_required?: boolean;
  payment_required?: boolean;
  restricted_writes?: boolean;
  created_at_lower_limit?: number;
  created_at_upper_limit?: number;
}

export interface RelayInformation {
  name?: string;
  description?: string;
  banner?: string;
  icon?: string;
  pubkey?: string;
  contact?: string;
  supported_nips?: Array<number | string>;
  software?: string;
  version?: string;
  limitation?: RelayLimitation;
  posting_policy?: string;
  payments_url?: string;
  relay_countries?: string[];
  tags?: string[];
}

const RELAY_WSS_URL = import.meta.env.VITE_NOSTR_RELAY_URL ?? '';
const FETCH_TIMEOUT_MS = 6000;
const SESSION_KEY = 'nip11:relay-info';

/** Convert a `wss://` / `ws://` relay URL to the `https://` / `http://` NIP-11 endpoint. */
export function relayHttpUrl(wssUrl: string): string {
  const trimmed = wssUrl.trim().replace(/\/$/, '');
  if (trimmed.startsWith('wss://')) return `https://${trimmed.slice('wss://'.length)}`;
  if (trimmed.startsWith('ws://')) return `http://${trimmed.slice('ws://'.length)}`;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

let inFlight: Promise<RelayInformation | null> | null = null;
let cached: RelayInformation | null = null;

function readSessionCache(): RelayInformation | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as RelayInformation) : null;
  } catch {
    return null;
  }
}

function writeSessionCache(info: RelayInformation): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(info));
  } catch {
    /* sessionStorage unavailable (private mode / SSR) — ignore */
  }
}

/**
 * Fetch the relay's NIP-11 document. Memoised for the session so navigation
 * between pages doesn't re-request. Returns null when the relay is unreachable,
 * blocks CORS, or the URL is unset.
 */
export async function fetchRelayInfo(): Promise<RelayInformation | null> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  const fromSession = readSessionCache();
  if (fromSession) {
    cached = fromSession;
    return fromSession;
  }

  if (!RELAY_WSS_URL) {
    console.error('VITE_NOSTR_RELAY_URL is not set — cannot fetch NIP-11 info');
    return null;
  }

  const url = relayHttpUrl(RELAY_WSS_URL);

  inFlight = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/nostr+json' },
        signal: controller.signal,
      });
      if (!res.ok) {
        console.error('NIP-11 fetch failed', res.status);
        return null;
      }
      const info = (await res.json()) as RelayInformation;
      cached = info;
      writeSessionCache(info);
      return info;
    } catch (err) {
      console.error('Error fetching NIP-11 relay info:', err);
      return null;
    } finally {
      clearTimeout(timeout);
      inFlight = null;
    }
  })();

  return inFlight;
}

/** Normalise `supported_nips` into sorted, zero-padded two-char strings for display. */
export function formatSupportedNips(nips: Array<number | string> | undefined): string[] {
  if (!nips?.length) return [];
  return [...nips]
    .map((n) => (typeof n === 'number' ? n : Number.parseInt(String(n), 10)))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b)
    .map((n) => String(n).padStart(2, '0'));
}

/** Combine `software` + `version` into a single human label, e.g. "strfry v1.0.3". */
export function formatSoftware(info: RelayInformation | null): string | null {
  if (!info?.software) return null;
  const software = info.software.replace(/^.*\/([^/]+)$/, '$1'); // strip repo URL prefix if present
  if (!info.version) return software;
  const version = info.version.startsWith('v') ? info.version : `v${info.version}`;
  return `${software} ${version}`;
}
