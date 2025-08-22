import React from 'react';

/**
 * Highlights search terms in text with HTML markup
 */
export function highlightText(text: string, searchTerm: string): React.ReactElement {
  if (!searchTerm.trim()) {
    return React.createElement('span', {}, text);
  }

  const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  
  // Create a regex pattern that matches any of the search words
  const pattern = searchWords
    .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  return React.createElement(
    'span',
    {},
    ...parts.map((part, index) => {
      if (searchWords.some(word => part.toLowerCase() === word)) {
        return React.createElement(
          'mark',
          { key: index, className: 'help-search-highlight' },
          part
        );
      }
      return part;
    })
  );
}

/**
 * Get CSS class for relevance score visualization
 */
export function getRelevanceClass(relevance: number): string {
  if (relevance >= 0.8) return 'relevance-very-high';
  if (relevance >= 0.6) return 'relevance-high';
  if (relevance >= 0.4) return 'relevance-medium';
  if (relevance >= 0.2) return 'relevance-low';
  return 'relevance-very-low';
}

/**
 * Get relevance label text
 */
export function getRelevanceLabel(relevance: number): string {
  if (relevance >= 0.8) return 'Very High';
  if (relevance >= 0.6) return 'High';
  if (relevance >= 0.4) return 'Medium';
  if (relevance >= 0.2) return 'Low';
  return 'Very Low';
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Convert slug to readable title
 */
export function slugToTitle(slug: string): string {
  return slug
    .split('/')
    .pop()
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase()) || '';
}

/**
 * Generate table of contents from HTML content
 */
export function extractTableOfContents(htmlContent: string): Array<{
  id: string;
  text: string;
  level: number;
}> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const headings = doc.querySelectorAll('h1, h2');
  
  return Array.from(headings).map(heading => ({
    id: heading.getAttribute('id') || '',
    text: heading.textContent || '',
    level: parseInt(heading.tagName.charAt(1))
  })).filter(h => h.id && h.text);
}

/**
 * Scroll to element with smooth animation
 */
export function scrollToElement(elementId: string, offset: number = 0): void {
  const element = document.getElementById(elementId);
  if (element) {
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top,
      behavior: 'smooth'
    });
  }
}

/**
 * Update URL hash without triggering navigation
 */
export function updateUrlHash(hash: string): void {
  const url = new URL(window.location.href);
  url.hash = hash;
  window.history.replaceState({}, '', url.toString());
}

/**
 * Get current URL hash without the # symbol
 */
export function getCurrentHash(): string {
  return window.location.hash.slice(1);
}

/**
 * Format date for help content timestamps
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}