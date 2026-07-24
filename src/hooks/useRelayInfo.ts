import { useEffect, useState } from 'react';
import { fetchRelayInfo, type RelayInformation } from '../services/nip11';

interface UseRelayInfoResult {
  info: RelayInformation | null;
  loading: boolean;
  /** True when the fetch completed but the relay returned nothing usable. */
  unavailable: boolean;
}

/**
 * Fetches the relay's NIP-11 information document once and shares the cached
 * result across components. Degrades gracefully: on failure `info` is null and
 * `unavailable` is true so callers can hide or fall back.
 */
export function useRelayInfo(): UseRelayInfoResult {
  const [info, setInfo] = useState<RelayInformation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchRelayInfo()
      .then((result) => {
        if (!cancelled) setInfo(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { info, loading, unavailable: !loading && info === null };
}
