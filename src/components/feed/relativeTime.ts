/** Compact localized relative timestamp ("5m ago", "hace 2 h") via the native
 * Intl API — falls back to an absolute date beyond ~30 days. */
export function formatRelativeTime(unixSeconds: number, lang: string): string {
  const diffSeconds = unixSeconds - Math.floor(Date.now() / 1000);
  const abs = Math.abs(diffSeconds);

  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;
  if (abs < 60) {
    value = diffSeconds;
    unit = 'second';
  } else if (abs < 3600) {
    value = Math.trunc(diffSeconds / 60);
    unit = 'minute';
  } else if (abs < 86_400) {
    value = Math.trunc(diffSeconds / 3600);
    unit = 'hour';
  } else if (abs < 30 * 86_400) {
    value = Math.trunc(diffSeconds / 86_400);
    unit = 'day';
  } else {
    return new Date(unixSeconds * 1000).toLocaleDateString(lang);
  }

  try {
    return new Intl.RelativeTimeFormat(lang, { style: 'narrow' }).format(value, unit);
  } catch {
    return new Date(unixSeconds * 1000).toLocaleDateString();
  }
}

/** Absolute timestamp for tooltips. */
export function formatAbsoluteTime(unixSeconds: number, lang: string): string {
  return new Date(unixSeconds * 1000).toLocaleString(lang);
}
