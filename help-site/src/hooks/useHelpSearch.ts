import { useState, useEffect, useMemo } from 'react';

export interface SearchResult {
  slug: string;
  title: string;
  snippet: string;
  relevance: number;
}

// This will be replaced by the actual help content once it's generated
let searchableContent: Array<{ slug: string; title: string; content: string }> = [];

// Load help content dynamically
const loadHelpContent = async () => {
  if (searchableContent.length === 0) {
    try {
      const helpModule = await import('../help-content');
      searchableContent = helpModule.searchableContent || [];
    } catch (error) {
      console.warn('Help content not yet generated. Run build:help-content first.');
    }
  }
  return searchableContent;
};

export const useHelpSearch = (query: string) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize the search function to avoid recreating it on every render
  const performSearch = useMemo(() => {
    return (searchQuery: string): SearchResult[] => {
      if (!searchQuery.trim() || searchableContent.length === 0) {
        return [];
      }

      const lowercaseQuery = searchQuery.toLowerCase();
      const queryWords = lowercaseQuery.split(/\s+/).filter(word => word.length > 0);

      const searchResults = searchableContent.map(item => {
        const titleLower = item.title.toLowerCase();
        const contentLower = item.content.toLowerCase();
        
        let relevance = 0;
        let totalMatches = 0;

        // Calculate relevance score
        queryWords.forEach(word => {
          // Title matches are more important
          if (titleLower.includes(word)) {
            relevance += 0.6;
            totalMatches++;
          }
          
          // Content matches
          const contentMatches = (contentLower.match(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
          if (contentMatches > 0) {
            relevance += Math.min(contentMatches * 0.1, 0.4);
            totalMatches += contentMatches;
          }
        });

        // Boost for exact phrase matches
        if (titleLower.includes(lowercaseQuery)) {
          relevance += 0.5;
        }
        if (contentLower.includes(lowercaseQuery)) {
          relevance += 0.3;
        }

        // Normalize relevance score (0-1)
        const maxPossibleScore = queryWords.length * 0.6 + 0.8; // Max from title + phrase bonuses
        relevance = Math.min(relevance / maxPossibleScore, 1);

        // Generate snippet
        const snippet = generateSnippet(item.content, lowercaseQuery, queryWords);

        return {
          slug: item.slug,
          title: item.title,
          snippet,
          relevance,
          totalMatches
        };
      })
      .filter(item => item.totalMatches > 0)
      .sort((a, b) => {
        // Sort by relevance, then by total matches
        if (Math.abs(a.relevance - b.relevance) < 0.01) {
          return b.totalMatches - a.totalMatches;
        }
        return b.relevance - a.relevance;
      })
      .slice(0, 10); // Limit to top 10 results

      return searchResults;
    };
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Debounce search
    const timeoutId = setTimeout(async () => {
      await loadHelpContent();
      const searchResults = performSearch(query);
      setResults(searchResults);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  return { results, isLoading };
};

function generateSnippet(content: string, fullQuery: string, queryWords: string[]): string {
  // Strip HTML tags
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (textContent.length === 0) {
    return '';
  }

  const maxSnippetLength = 150;
  const contextLength = 60;
  
  // Find the best position for the snippet
  const fullQueryIndex = textContent.toLowerCase().indexOf(fullQuery.toLowerCase());
  if (fullQueryIndex !== -1) {
    // Full query found - center snippet around it
    const start = Math.max(0, fullQueryIndex - contextLength);
    const end = Math.min(textContent.length, fullQueryIndex + fullQuery.length + contextLength);
    return textContent.slice(start, end) + (end < textContent.length ? '...' : '');
  }

  // Find first occurrence of any query word
  let bestPosition = -1;
  let bestWord = '';
  
  for (const word of queryWords) {
    const wordIndex = textContent.toLowerCase().indexOf(word);
    if (wordIndex !== -1 && (bestPosition === -1 || wordIndex < bestPosition)) {
      bestPosition = wordIndex;
      bestWord = word;
    }
  }

  if (bestPosition !== -1) {
    const start = Math.max(0, bestPosition - contextLength);
    const end = Math.min(textContent.length, bestPosition + bestWord.length + contextLength);
    return (start > 0 ? '...' : '') + 
           textContent.slice(start, end) + 
           (end < textContent.length ? '...' : '');
  }

  // Fallback to beginning of content
  return textContent.slice(0, maxSnippetLength) + 
         (textContent.length > maxSnippetLength ? '...' : '');
}