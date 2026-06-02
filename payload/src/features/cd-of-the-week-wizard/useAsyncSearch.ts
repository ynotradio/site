import { useState, useEffect, useCallback } from 'react';

export interface SearchItem {
  id: number;
  name: string;
}

export const useAsyncSearch = (collectionSlug: string) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selected, setSelected] = useState<SearchItem | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `/api/${collectionSlug}?where[name][contains]=${encodeURIComponent(query)}&limit=10&sort=name`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setResults((data.docs as SearchItem[]) ?? []);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, collectionSlug]);

  const select = useCallback((item: SearchItem) => {
    setSelected(item);
    setQuery('');
    setResults([]);
  }, []);

  const clear = useCallback(() => {
    setSelected(null);
    setQuery('');
    setResults([]);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    selected,
    select,
    clear,
  };
};
