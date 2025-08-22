import React, { useState, useEffect } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ headings }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -80% 0px'
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Update URL hash
      const url = new URL(window.location.href);
      url.hash = id;
      window.history.replaceState({}, '', url.toString());
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">On this page</h3>
      <ul className="space-y-2 text-sm">
        {headings.map((heading, index) => (
          <li key={`${heading.id}-${index}`} className={heading.level === 2 ? 'ml-3' : ''}>
            <button
              onClick={() => scrollToHeading(heading.id)}
              className={`
                text-left w-full py-1 px-2 rounded transition-colors
                ${activeId === heading.id
                  ? 'text-drizzle-700 bg-drizzle-100 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
                ${heading.level === 1 ? 'font-semibold text-base' : ''}
                ${heading.level === 2 ? 'font-medium' : ''}
              `}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TableOfContents;