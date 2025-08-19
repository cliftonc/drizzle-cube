import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import SearchInterface from './SearchInterface';
import Navigation from './Navigation';
import BackToTop from './BackToTop';

interface HelpLayoutProps {
  children: React.ReactNode;
}

const HelpLayout: React.FC<HelpLayoutProps> = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const isHomePage = location.pathname === '/' || location.pathname === '/help';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-xs border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <Link to="/help" className="flex items-center">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Drizzle Cube</h1>
                  <p className="text-xs text-gray-500">Help Center</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Desktop only - Search and GitHub */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden lg:flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>Search documentation...</span>
              </button>
              
              <a
                href="https://github.com/cliftonc/drizzle-cube"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:block text-sm text-drizzle-600 hover:text-drizzle-700 font-medium"
              >
                GitHub
              </a>
              
              {/* Always visible - Live Sandbox */}
              <a
                href="https://try.drizzle-cube.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 lg:px-4 bg-linear-to-r from-blue-600 to-indigo-600 text-white text-xs lg:text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                <span className="lg:hidden">🚀 Try Live</span>
                <span className="hidden lg:inline">🚀 View Live Sandbox</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
              <span className="text-lg font-semibold text-gray-900">Navigation</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Mobile-only actions */}
            <div className="p-4 border-b border-gray-200 space-y-3 lg:hidden">
              <button
                onClick={() => {
                  setIsSearchOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>Search documentation...</span>
              </button>
              
              <a
                href="https://github.com/cliftonc/drizzle-cube"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-drizzle-600 hover:text-drizzle-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub Repository</span>
              </a>
            </div>
            
            <Navigation onNavigate={() => setIsSidebarOpen(false)} />
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Search Modal */}
      <SearchInterface 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default HelpLayout;