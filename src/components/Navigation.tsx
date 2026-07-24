import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui';

export function Navigation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useStore();
  const { t } = useTranslation();
  const isIframe = searchParams.get('iframe') === '1';

  const handleLogout = () => {
    setUser(null);
    navigate('/login' + (isIframe ? '?iframe=1' : ''), { replace: true });
  };

  const getPath = (path: string) => (isIframe ? `${path}?iframe=1` : path);

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-outline-variant bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link
            to={getPath('/')}
            className="flex items-center space-x-2"
          >
            {import.meta.env.VITE_LOGO_URL ? (
              <img src={import.meta.env.VITE_LOGO_URL} alt="Noderunners" className="h-8 w-auto" />
            ) : (
              <>
                <Flame className="h-7 w-7 text-primary" />
                <span className="font-display text-headline-md font-bold text-primary tracking-tight">
                  NODERUNNERS
                </span>
              </>
            )}
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <LanguageSwitcher />
            {user ? (
              <>
                <Link
                  to={getPath('/dashboard')}
                  className="font-mono text-label-mono text-on-surface-variant hover:text-primary transition-colors"
                >
                  {t('nav.dashboard')}
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  {t('nav.logOut')}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate(getPath('/login'))}>
                {t('nav.logIn')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
