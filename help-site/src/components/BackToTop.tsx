import React, { useState, useEffect } from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

/**
 * Floating back to top button that appears when user scrolls down
 */
const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-drizzle-600 text-white rounded-full shadow-lg hover:bg-drizzle-700 transition-all duration-300 hover:scale-110 focus:outline-hidden focus:ring-2 focus:ring-drizzle-500 focus:ring-offset-2"
          aria-label="Back to top"
        >
          <ChevronUpIcon className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

export default BackToTop;