import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useHelpSearch } from '../hooks/useHelpSearch';
import { getRelevanceClass, highlightText } from '../utils/helpUtils';

interface SearchInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchInterface: React.FC<SearchInterfaceProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, isLoading } = useHelpSearch(query);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleResultClick = (slug: string) => {
    navigate(`/help/${slug}`);
    onClose();
    setQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleResultClick(results[0].slug);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center p-4 text-center sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative w-full max-w-2xl mt-20 transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Search Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Search Documentation</h2>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for help topics, features, or concepts..."
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm focus:border-drizzle-500 focus:outline-none focus:ring-2 focus:ring-drizzle-500"
                />
              </div>
            </form>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto px-6 py-4">
            {query.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>Start typing to search the documentation</p>
              </div>
            ) : isLoading ? (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-drizzle-500 mx-auto mb-4"></div>
                <p>Searching...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-2">Try different keywords or check your spelling</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result) => (
                  <button
                    key={result.slug}
                    onClick={() => handleResultClick(result.slug)}
                    className="w-full text-left rounded-lg border border-gray-200 p-4 hover:border-drizzle-300 hover:bg-drizzle-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {highlightText(result.title, query)}
                        </h3>
                        {result.snippet && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {highlightText(result.snippet, query)}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          /help/{result.slug}
                        </p>
                      </div>
                      
                      <div className={`ml-4 flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium border ${getRelevanceClass(result.relevance)}`}>
                        {Math.round(result.relevance * 100)}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Footer */}
          {query.length > 0 && results.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Press Enter to navigate to the first result, or click on any result
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchInterface;