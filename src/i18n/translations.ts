import { en } from './locales/en';
import { nl } from './locales/nl';
import { es } from './locales/es';

export type { TranslationSchema } from './locales/en';

export type Lang = 'en' | 'nl' | 'es';

export const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

// English is the source of truth. Each language lives in its own file under
// ./locales, and other languages fall back to English for any missing key.
export const translations: Record<Lang, import('./locales/en').TranslationSchema> = {
  en,
  nl,
  es,
};
