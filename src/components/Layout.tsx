import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      <main className="container mx-auto px-4 py-4 md:py-8 min-h-[calc(100vh-64px-160px)]">
        <Outlet />
      </main>
      <footer className="border-t border-gray-800 py-6 md:py-8 mt-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6 mb-4">
            <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <a 
              href={import.meta.env.VITE_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Noderunners - A project of 21 Toxic Bitcoin Maximalists</p>
          <p className="mt-2 text-gray-400 text-sm">Always under development</p>
        </div>
      </footer>
    </div>
  );
}