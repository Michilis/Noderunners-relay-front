import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Flame, Menu, X } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    setUser(null);
    setIsMenuOpen(false);
    navigate('/login', { replace: true }); // Use replace to prevent going back to dashboard
  };

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-900 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2" onClick={handleNavigation}>
            {import.meta.env.VITE_LOGO_URL ? (
              <img 
                src={import.meta.env.VITE_LOGO_URL} 
                alt="Noderunners" 
                className="h-8 w-auto"
              />
            ) : (
              <>
                <Flame className="h-8 w-8 text-orange-500" />
                <span className="text-xl font-bold">Noderunners</span>
              </>
            )}
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Connect Nostr
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={handleMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-800 py-4">
            <div className="flex flex-col space-y-2">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={handleNavigation}
                    className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={handleNavigation}
                  className="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors text-center"
                >
                  Connect Nostr
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}