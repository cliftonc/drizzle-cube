import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useHelpSearch } from '../hooks/useHelpSearch';
import { highlightText, getRelevanceClass } from '../utils/helpUtils';

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { results } = useHelpSearch(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      navigate(`/help/${results[0].slug}`);
    }
  };

  const quickStartLinks = [
    { title: 'Installation', slug: 'getting-started/installation', description: 'Add analytics to your existing platform' },
    { title: 'Quick Start', slug: 'getting-started/quick-start', description: 'Embed your first dashboard in 5 minutes' },
    { title: 'Core Concepts', slug: 'getting-started/concepts', description: 'Understanding embeddable analytics architecture' },
    { title: 'Hono Adapter', slug: 'adapters/hono', description: 'One-line integration with your web framework' },
  ];

  const featuredTopics = [
    { 
      title: 'Embedding Components', 
      slug: 'client', 
      description: 'Drop-in React components for dashboards and charts'
    },
    { 
      title: 'Multi-Tenant Security', 
      slug: 'semantic-layer/security', 
      description: 'Secure data isolation for your platform users'
    },
    { 
      title: 'Semantic Layer', 
      slug: 'semantic-layer', 
      description: 'Transform your database into business metrics'
    },
    { 
      title: 'Scaling Analytics', 
      slug: 'advanced/performance', 
      description: 'Handle thousands of users with optimized queries'
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Drizzle Cube</h1>
          <p className="text-lg text-gray-600">Help Center</p>
        </div>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          <strong>Embeddable Analytics Solution</strong> for platform builders. 
          Deliver scalable, type-safe dashboarding capabilities directly to your users with zero infrastructure overhead.
        </p>

        {/* Dashboard Preview */}
        <div className="mb-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="relative group cursor-pointer" onClick={() => setFullscreenImage('/dashboard-screenshot.png')}>
              <img 
                src="/dashboard-screenshot.png" 
                alt="Drizzle Cube Analytics Dashboard showing productivity trends and team happiness distribution charts"
                className="w-full h-64 object-cover rounded-lg shadow-lg border border-gray-200 group-hover:shadow-xl transition-shadow"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center">
                <div className="bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to view full size
                </div>
              </div>
            </div>
            <div className="relative group cursor-pointer" onClick={() => setFullscreenImage('/query-builder.png')}>
              <img 
                src="/query-builder.png" 
                alt="Drizzle Cube Query Builder interface for building analytics queries"
                className="w-full h-64 object-cover rounded-lg shadow-lg border border-gray-200 group-hover:shadow-xl transition-shadow"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center">
                <div className="bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to view full size
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-3">
            Dashboard and Query Builder interfaces with Drizzle Cube
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full rounded-xl border border-gray-300 py-4 pl-12 pr-4 text-lg focus:border-drizzle-500 focus:outline-hidden focus:ring-2 focus:ring-drizzle-500 shadow-xs"
            />
          </div>
        </form>

        {/* Search Results Preview */}
        {searchQuery && results.length > 0 && (
          <div className="max-w-2xl mx-auto mb-8 bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <p className="text-sm text-gray-600">Search Results</p>
            </div>
            <div className="divide-y divide-gray-200">
              {results.slice(0, 3).map((result) => (
                <Link
                  key={result.slug}
                  to={`/help/${result.slug}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {highlightText(result.title, searchQuery)}
                      </h3>
                      {result.snippet && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {highlightText(result.snippet, searchQuery)}
                        </p>
                      )}
                    </div>
                    <div className={`ml-4 shrink-0 px-2 py-1 rounded-full text-xs font-medium border ${getRelevanceClass(result.relevance)}`}>
                      {Math.round(result.relevance * 100)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {results.length > 3 && (
              <div className="p-4 bg-gray-50 text-center">
                <p className="text-sm text-gray-600">
                  {results.length - 3} more results available
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Start Links */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickStartLinks.map((link) => (
            <Link
              key={link.slug}
              to={`/help/${link.slug}`}
              className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-drizzle-300 hover:shadow-md transition-all"
            >
              <div className="mb-2">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-drizzle-700">
                  {link.title}
                </h3>
              </div>
              <p className="text-gray-600">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Topics */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {featuredTopics.map((topic) => (
            <Link
              key={topic.slug}
              to={`/help/${topic.slug}`}
              className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-drizzle-300 hover:shadow-md transition-all"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-drizzle-700 mb-2">
                  {topic.title}
                </h3>
                <p className="text-gray-600">{topic.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Used By Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Used by these websites</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="https://www.fintune.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-drizzle-300 hover:shadow-md transition-all flex items-center space-x-4"
          >
            <img 
              src="/fintune.png" 
              alt="Fintune logo" 
              className="w-12 h-12 object-contain flex-shrink-0"
            />
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-drizzle-700 mb-1">
                Fintune
              </h3>
              <p className="text-gray-600">Smart team and financial budgeting and forecasting</p>
            </div>
          </a>
          
          <div className="group p-6 bg-gray-50 rounded-lg border border-gray-200 border-dashed flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-600 mb-1">
                Add your site here?
              </h3>
              <p className="text-gray-500 text-sm">Contact us to showcase your project</p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="bg-drizzle-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Need More Help?</h2>
        <p className="text-gray-600 mb-6">
          Can't find what you're looking for? Check out these additional resources.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://github.com/cliftonc/drizzle-cube"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            View on GitHub
          </a>
          <a
            href="https://github.com/cliftonc/drizzle-cube/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Report an Issue
          </a>
        </div>
      </section>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <img 
              src={fullscreenImage} 
              alt="Fullscreen view"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;