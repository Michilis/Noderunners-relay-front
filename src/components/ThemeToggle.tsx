import React, { useEffect, useRef, useState } from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemeMode } from '../hooks/useTheme';
import { useTranslation } from '../i18n';
import { cn } from './ui/cn';

const MODE_ICONS: Record<ThemeMode, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  auto: Monitor,
};

const MODES: ThemeMode[] = ['light', 'dark', 'auto'];

/** Header dropdown for light / dark / auto theme, styled like the LanguageSwitcher. */
export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const CurrentIcon = MODE_ICONS[mode];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('theme.toggle')}
        title={t('theme.toggle')}
        className="flex h-9 w-9 items-center justify-center rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
      >
        <CurrentIcon className="h-4.5 w-4.5" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('theme.toggle')}
          className="absolute right-0 mt-2 min-w-[9rem] rounded border border-outline-variant bg-surface-container-high shadow-lg py-1 z-50"
        >
          {MODES.map((m) => {
            const Icon = MODE_ICONS[m];
            return (
              <li key={m} role="option" aria-selected={m === mode}>
                <button
                  onClick={() => {
                    setMode(m);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2 font-body text-body-md transition-colors',
                    m === mode ? 'text-primary' : 'text-on-surface hover:bg-surface-container',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="flex-grow text-left">{t(`theme.${m}`)}</span>
                  {m === mode && <Check className="h-4 w-4 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
