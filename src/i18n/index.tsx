import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { translations, type Lang } from './translations';

export { LANGUAGES } from './translations';
export type { Lang } from './translations';

const STORAGE_KEY = 'noderunners.lang';
const DEFAULT_LANG: Lang = 'en';

const SUPPORTED: Lang[] = ['en', 'nl', 'es'];

/** Pick the first supported language from the visitor's browser/system preferences. */
function detectBrowserLang(): Lang | null {
  if (typeof navigator === 'undefined') return null;
  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const tag of candidates) {
    // Match on the primary subtag, e.g. "nl-BE" -> "nl".
    const base = tag?.toLowerCase().split('-')[0];
    if (base && SUPPORTED.includes(base as Lang)) {
      return base as Lang;
    }
  }
  return null;
}

function readInitialLang(): Lang {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  // A saved choice always wins — the visitor picked it manually before.
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && SUPPORTED.includes(saved as Lang)) {
    return saved as Lang;
  }
  // First visit: fall back to the browser/system language when it's supported.
  return detectBrowserLang() ?? DEFAULT_LANG;
}

type Vars = Record<string, string | number>;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Walk a dot-separated key path through a nested translation object. */
function lookup(dict: unknown, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined,
      dict,
    );
  // Treat empty / whitespace-only strings as missing so callers fall back to English.
  if (typeof value === 'string' && value.trim() !== '') return value;
  return undefined;
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);

  const t = useCallback(
    (key: string, vars?: Vars): string => {
      const value = lookup(translations[lang], key) ?? lookup(translations.en, key) ?? key;
      return interpolate(value, vars);
    },
    [lang],
  );

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return ctx;
}
