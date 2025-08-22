import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TableOfContents from './TableOfContents';

interface TopicRendererProps {
  content: string;
  title: string;
  showToc?: boolean;
}

const TopicRenderer: React.FC<TopicRendererProps> = ({ content, title, showToc = true }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!contentRef.current) return;

    // Trigger Prism.js syntax highlighting
    if (window.Prism) {
      window.Prism.highlightAllUnder(contentRef.current);
    }

    // Handle internal help links
    const handleHelpLinkClick = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Find the closest element with data-help-link (could be the target or a parent)
      const linkElement = target.closest('[data-help-link]') as HTMLElement;
      const helpLink = linkElement?.getAttribute('data-help-link');
      
      if (helpLink) {
        e.preventDefault();
        navigate(`/help/${helpLink}`);
      }
    };

    // Add click listeners to all help links
    const helpLinks = contentRef.current.querySelectorAll('[data-help-link]');
    helpLinks.forEach(link => {
      link.addEventListener('click', handleHelpLinkClick);
    });

    // Handle copy to clipboard functionality
    const handleCopyClick = async (e: Event) => {
      const button = e.currentTarget as HTMLButtonElement;
      const codeText = button.getAttribute('data-code');
      
      if (!codeText) return;
      
      try {
        // Decode HTML entities back to original text
        const decodedText = codeText
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
          
        await navigator.clipboard.writeText(decodedText);
        
        // Show feedback
        const originalSvg = button.innerHTML;
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        `;
        button.style.backgroundColor = '#10b981';
        
        setTimeout(() => {
          button.innerHTML = originalSvg;
          button.style.backgroundColor = '';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        // Fallback for older browsers
        const decodedTextFallback = codeText
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        const textArea = document.createElement('textarea');
        textArea.value = decodedTextFallback;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show feedback
        const originalSvgFallback = button.innerHTML;
        button.textContent = '✓';
        setTimeout(() => {
          button.innerHTML = originalSvgFallback;
        }, 2000);
      }
    };

    // Add click listeners to all copy buttons
    const copyButtons = contentRef.current.querySelectorAll('.copy-code-btn');
    copyButtons.forEach(button => {
      button.addEventListener('click', handleCopyClick);
    });

    // Add click listeners to heading anchors for smooth scrolling
    const headings = contentRef.current.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]');
    headings.forEach(heading => {
      heading.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).getAttribute('id');
        if (id) {
          // Update URL hash without triggering navigation
          const url = new URL(window.location.href);
          url.hash = id;
          window.history.replaceState({}, '', url.toString());
          
          // Smooth scroll to element
          heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      
      // Make headings look clickable
      (heading as HTMLElement).style.cursor = 'pointer';
      heading.setAttribute('title', 'Click to copy link to this section');
    });

    // Cleanup
    return () => {
      helpLinks.forEach(link => {
        link.removeEventListener('click', handleHelpLinkClick);
      });
      copyButtons.forEach(button => {
        button.removeEventListener('click', handleCopyClick);
      });
    };
  }, [content, navigate]);

  // Extract headings for table of contents
  const extractHeadings = (htmlContent: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const headings = doc.querySelectorAll('h2, h3, h4, h5, h6');
    
    return Array.from(headings).map((heading, index) => ({
      id: heading.getAttribute('id') || `heading-${index}`,
      text: heading.textContent || '',
      level: parseInt(heading.tagName.charAt(1))
    })).filter(h => h.id && h.text);
  };

  const headings = extractHeadings(content);
  const showTableOfContents = showToc && headings.length > 0;

  return (
    <div className="flex gap-8">
      <article className="flex-1 min-w-0">
        <div
          ref={contentRef}
          className="help-prose prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </article>
      
      {showTableOfContents && (
        <aside className="hidden xl:block w-56 shrink-0">
          <div className="sticky top-8">
            <TableOfContents headings={headings} />
          </div>
        </aside>
      )}
    </div>
  );
};

export default TopicRenderer;