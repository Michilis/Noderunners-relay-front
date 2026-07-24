import React, { useEffect, useRef, useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { LANGUAGES, useTranslation } from '../i18n';
import { cn } from './ui/cn';

interface LanguageSwitcherProps {
  className?: string;
  /** Render as a full-width stacked list (used inside the mobile menu). */
  variant?: 'dropdown' | 'inline';
}

export function LanguageSwitcher({ className, variant = 'dropdown' }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

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

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-col space-y-1', className)}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={cn(
              'flex items-center gap-3 px-4 py-2 rounded font-body text-body-md transition-colors',
              l.code === lang
                ? 'text-primary'
                : 'text-on-surface hover:bg-surface-container',
            )}
          >
            <span aria-hidden="true">{l.flag}</span>
            <span className="flex-grow text-left">{l.label}</span>
            {l.code === lang && <Check className="h-4 w-4 text-primary" />}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.switcher')}
        className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors font-mono text-label-mono"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{current.code}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-2 min-w-[10rem] rounded border border-outline-variant bg-surface-container-high shadow-lg py-1 z-50"
        >
          {LANGUAGES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 font-body text-body-md transition-colors',
                  l.code === lang
                    ? 'text-primary'
                    : 'text-on-surface hover:bg-surface-container',
                )}
              >
                <span aria-hidden="true">{l.flag}</span>
                <span className="flex-grow text-left">{l.label}</span>
                {l.code === lang && <Check className="h-4 w-4 text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
