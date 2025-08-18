import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import TopicRenderer from '../components/TopicRenderer';

// This will be replaced by the actual help content once it's generated
let helpContentMap: Record<string, any> = {};

const TopicPage: React.FC = () => {
  const { topic = '' } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [helpTopic, setHelpTopic] = useState<any>(null);

  // Handle nested routes by extracting the full topic path
  const fullTopic = location.pathname.replace('/help/', '').replace(/^\//, '');

  useEffect(() => {
    const loadContent = async () => {
      // Reset state at the beginning of each navigation
      setLoading(true);
      setNotFound(false);
      setHelpTopic(null);
      
      try {
        const helpModule = await import('../help-content');
        helpContentMap = helpModule.helpContentMap || {};
        const topic = helpContentMap[fullTopic];
        setHelpTopic(topic);
        if (!topic) {
          setNotFound(true);
        }
      } catch (error) {
        console.warn('Help content not yet generated. Run build:help-content first.');
        setNotFound(true);
      }
      setLoading(false);
    };

    loadContent();
  }, [fullTopic]);

  // Update document title
  useEffect(() => {
    if (helpTopic) {
      document.title = `${helpTopic.title} - Drizzle Cube Help`;
    } else if (!loading) {
      document.title = 'Not Found - Drizzle Cube Help';
    }

    return () => {
      document.title = 'Drizzle Cube Help';
    };
  }, [helpTopic, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-drizzle-500"></div>
      </div>
    );
  }

  if (notFound || !helpTopic) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Help Topic Not Found</h1>
        <p className="text-lg text-gray-600 mb-8">
          The help topic "{fullTopic}" doesn't exist or may have been moved.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 bg-drizzle-600 text-white rounded-lg hover:bg-drizzle-700 transition-colors mr-4"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-2" />
            Go Back
          </button>
          
          <button
            onClick={() => navigate('/help')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go to Help Home
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left">
          <h3 className="font-semibold text-gray-900 mb-2">Suggestions:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Check the URL for typos</li>
            <li>• Use the search function to find related topics</li>
            <li>• Browse the navigation menu for available help topics</li>
            <li>• <a href="https://github.com/cliftonc/drizzle-cube/issues" target="_blank" rel="noopener noreferrer" className="text-drizzle-600 hover:underline">Report this issue</a> if you think this page should exist</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <nav className="mb-8">
        <button
          onClick={() => navigate('/help')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-1" />
          Back to Help Home
        </button>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Help</span>
          {fullTopic.split('/').map((segment, index, array) => (
            <React.Fragment key={index}>
              <span>/</span>
              <span className={index === array.length - 1 ? 'text-gray-900 font-medium' : ''}>
                {segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Topic Content */}
      <TopicRenderer 
        content={helpTopic.content} 
        title={helpTopic.title}
        showToc={true}
      />

      {/* Footer Navigation */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              Was this page helpful?
            </p>
          </div>
          <div className="space-x-4">
            <a
              href={`https://github.com/cliftonc/drizzle-cube/edit/main/help-site/content/${helpTopic.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-drizzle-600 hover:text-drizzle-700 hover:underline"
            >
              Edit this page
            </a>
            <a
              href="https://github.com/cliftonc/drizzle-cube/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-drizzle-600 hover:text-drizzle-700 hover:underline"
            >
              Report an issue
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicPage;