import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

/** Must match the bootstrap script in index.html. */
const STORAGE_KEY = 'noderunners.theme';
const DEFAULT_MODE: ThemeMode = 'dark';

const MODES: ThemeMode[] = ['light', 'dark', 'auto'];

function readInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved && MODES.includes(saved as ThemeMode) ? (saved as ThemeMode) : DEFAULT_MODE;
}

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

interface ThemeContextValue {
  /** The user's choice: explicit light/dark, or auto (follow the system). */
  mode: ThemeMode;
  /** What is actually applied right now. */
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode);
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme);

  const resolved: ResolvedTheme = mode === 'auto' ? system : mode;

  // Track the OS preference so auto mode updates live.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches ? 'light' : 'dark');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, mode);
    document.documentElement.dataset.theme = resolved;
  }, [mode, resolved]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode }),
    [mode, resolved, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
