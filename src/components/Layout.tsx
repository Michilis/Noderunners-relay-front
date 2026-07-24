import React from 'react';
import { Flame } from 'lucide-react';
import { Link, Outlet, useSearchParams } from 'react-router-dom';
import { Navigation } from './Navigation';
import { useTranslation } from '../i18n';

export function Layout() {
  const [searchParams] = useSearchParams();
  const isIframe = searchParams.get('iframe') === '1';
  const { t } = useTranslation();

  if (isIframe) {
    return (
      <div className="min-h-screen bg-background text-on-surface relative">
        <main className="container mx-auto px-4 py-4 md:py-8">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface relative overflow-x-hidden">
      <div className="grid-bg" aria-hidden="true" />
      <div className="glow-accent top-[-200px] left-[-200px]" aria-hidden="true" />
      <div className="glow-accent bottom-[-200px] right-[-200px]" aria-hidden="true" />

      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-16 md:pb-24 min-h-[calc(100vh-64px-120px)]">
        <Outlet />
      </main>

      <footer className="w-full border-t border-outline-variant bg-surface-container-lowest">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4 py-8 px-4">
          <div className="flex items-center space-x-2">
            {import.meta.env.VITE_LOGO_URL ? (
              <img src={import.meta.env.VITE_LOGO_URL} alt="Noderunners" className="h-8 w-auto" />
            ) : (
              <Flame className="h-7 w-7 text-primary" />
            )}
            <span className="font-display text-headline-md font-bold text-primary tracking-tight">
              Relay
            </span>
          </div>
          <p className="font-mono text-label-sm-mono text-on-tertiary-fixed-variant text-center">
            © {new Date().getFullYear()} NODERUNNERS. {t('footer.tagline')}
          </p>
          <div className="flex space-x-6 font-mono text-label-sm-mono text-on-tertiary-fixed-variant">
            <Link to="/terms" className="hover:text-primary transition-colors">
              {t('footer.terms')}
            </Link>
            <a
              href={import.meta.env.VITE_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
