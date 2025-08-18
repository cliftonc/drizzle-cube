import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useHelpSearch } from '../hooks/useHelpSearch';
import { highlightText, getRelevanceClass } from '../utils/helpUtils';

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { results } = useHelpSearch(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      navigate(`/help/${results[0].slug}`);
    }
  };

  const quickStartLinks = [
    { title: 'Installation', slug: 'getting-started/installation', description: 'Get Drizzle Cube up and running' },
    { title: 'Quick Start', slug: 'getting-started/quick-start', description: 'Build your first semantic layer' },
    { title: 'Core Concepts', slug: 'getting-started/concepts', description: 'Understanding cubes, dimensions, and measures' },
    { title: 'Hono Adapter', slug: 'adapters/hono', description: 'Web framework integration' },
  ];

  const featuredTopics = [
    { 
      title: 'Semantic Layer', 
      slug: 'semantic-layer', 
      description: 'Learn how to define type-safe data cubes with Drizzle ORM'
    },
    { 
      title: 'React Components', 
      slug: 'client', 
      description: 'Pre-built dashboard and chart components for React'
    },
    { 
      title: 'Security', 
      slug: 'semantic-layer/security', 
      description: 'Multi-tenant security with SQL injection protection'
    },
    { 
      title: 'Performance', 
      slug: 'advanced/performance', 
      description: 'Optimization techniques for large datasets'
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
          Drizzle ORM-first semantic layer with Cube.js compatibility. 
          Type-safe analytics and dashboards with SQL injection protection.
        </p>

        {/* Dashboard Preview */}
        <div className="mb-12 max-w-5xl mx-auto">
          <img 
            src="/dashboard-screenshot.png" 
            alt="Drizzle Cube Analytics Dashboard showing productivity trends and team happiness distribution charts"
            className="w-full rounded-lg shadow-lg border border-gray-200"
          />
          <p className="text-center text-sm text-gray-500 mt-3">
            Example dashboard showing real-time analytics with Drizzle Cube
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
              className="w-full rounded-xl border border-gray-300 py-4 pl-12 pr-4 text-lg focus:border-drizzle-500 focus:outline-none focus:ring-2 focus:ring-drizzle-500 shadow-sm"
            />
          </div>
        </form>

        {/* Search Results Preview */}
        {searchQuery && results.length > 0 && (
          <div className="max-w-2xl mx-auto mb-8 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
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
                    <div className={`ml-4 flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium border ${getRelevanceClass(result.relevance)}`}>
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
    </div>
  );
};

export default HomePage;