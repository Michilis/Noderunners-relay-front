// Media URLs are never rendered inline (untrusted content, layout stability) —
// they collapse into a small counted chip instead.
const MEDIA_URL_RE = /https?:\/\/\S+\.(?:png|jpe?g|gif|webp|avif|svg|mp4|webm|mov)(?:\?\S*)?/gi;

export function splitMedia(content: string): { text: string; mediaCount: number } {
  const matches = content.match(MEDIA_URL_RE);
  if (!matches) return { text: content.trim(), mediaCount: 0 };
  return {
    text: content.replace(MEDIA_URL_RE, '').replace(/\s{2,}/g, ' ').trim(),
    mediaCount: matches.length,
  };
}
