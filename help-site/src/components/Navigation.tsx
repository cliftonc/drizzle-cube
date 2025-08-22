import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface NavigationProps {
  onNavigate?: () => void;
}

interface NavSection {
  title: string;
  items: Array<{
    title: string;
    slug: string;
    description?: string;
  }>;
}

const navigationSections: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', slug: 'getting-started', description: 'What is Drizzle Cube?' },
      { title: 'Installation', slug: 'getting-started/installation', description: 'Install and setup' },
      { title: 'Quick Start', slug: 'getting-started/quick-start', description: 'Build your first semantic layer' },
      { title: 'Scaling Your SaaS', slug: 'getting-started/scaling', description: 'How Drizzle Cube grows with your business' },
    ]
  },
  {
    title: 'Semantic Layer',
    items: [
      { title: 'Overview', slug: 'semantic-layer', description: 'Semantic layer concepts' },
      { title: 'Cubes', slug: 'semantic-layer/cubes', description: 'Define data cubes' },
      { title: 'Dimensions', slug: 'semantic-layer/dimensions', description: 'Categorical data' },
      { title: 'Measures', slug: 'semantic-layer/measures', description: 'Metrics and aggregations' },
      { title: 'Joins', slug: 'semantic-layer/joins', description: 'Joining multiple cubes' },
      { title: 'Security', slug: 'semantic-layer/security', description: 'Multi-tenant security' },
    ]
  },
  {
    title: 'Client Components',
    items: [
      { title: 'React Client', slug: 'client', description: 'React components overview' },
      { title: 'Charts', slug: 'client/charts', description: 'Visualization components' },
      { title: 'Dashboards', slug: 'client/dashboards', description: 'Dashboard grids and layouts' },
      { title: 'Hooks', slug: 'client/hooks', description: 'React hooks for data' },
    ]
  },
  {
    title: 'Adapters',
    items: [
      { title: 'Express', slug: 'adapters/express', description: 'Express.js web framework adapter' },
      { title: 'Fastify', slug: 'adapters/fastify', description: 'Fastify web framework adapter' },
      { title: 'Hono', slug: 'adapters/hono', description: 'Hono web framework adapter' },
      { title: 'Next.js', slug: 'adapters/nextjs', description: 'Next.js App Router adapter' },
      { title: 'Custom Adapters', slug: 'adapters/custom', description: 'Build your own adapter' },
    ]
  },
  {
    title: 'Examples',
    items: [
      { title: 'Express', slug: 'examples/express', description: 'Express.js server with React client' },
      { title: 'Fastify', slug: 'examples/fastify', description: 'Fastify server with React client' },
      { title: 'Hono', slug: 'examples/hono', description: 'Hono server with dashboard management' },
      { title: 'Next.js', slug: 'examples/nextjs', description: 'Next.js 15 full-stack application' },
    ]
  },
  {
    title: 'Advanced',
    items: [
      { title: 'Performance', slug: 'advanced/performance', description: 'Optimization techniques' },
      { title: 'Troubleshooting', slug: 'advanced/troubleshooting', description: 'Common issues and solutions' },
      { title: 'TypeScript', slug: 'advanced/typescript', description: 'Advanced TypeScript usage' },
    ]
  }
];

const Navigation: React.FC<NavigationProps> = ({ onNavigate }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Getting Started': true,
    'Semantic Layer': true
  });
  const location = useLocation();

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  const isActiveLink = (slug: string) => {
    const currentPath = location.pathname.replace('/help/', '').replace('/help', '');
    return currentPath === slug;
  };

  return (
    <nav className="flex-1 overflow-y-auto p-4">
      <div className="space-y-6">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <button
              onClick={() => toggleSection(section.title)}
              className="flex items-center justify-between w-full text-left px-2 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <span>{section.title}</span>
              {expandedSections[section.title] ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
            
            {expandedSections[section.title] && (
              <div className="mt-2 space-y-1 ml-2">
                {section.items.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/help/${item.slug}`}
                    onClick={onNavigate}
                    className={`
                      block px-3 py-2 text-sm rounded-md transition-colors
                      ${isActiveLink(item.slug)
                        ? 'bg-drizzle-100 text-drizzle-700 border-r-2 border-drizzle-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div>
                      <div className="font-medium">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Footer Links */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          <a
            href="https://github.com/cliftonc/drizzle-cube"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            GitHub Repository
          </a>
          <a
            href="https://github.com/cliftonc/drizzle-cube/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            Report Issues
          </a>
          <a
            href="https://drizzle.team"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            Drizzle ORM
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;