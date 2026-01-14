import { useState, useCallback, useRef } from 'react';

export interface MusicBrainzSearchResult {
  id: string;
  name: string;
  score?: number;
  [key: string]: any; // Allow additional properties
}

interface UseMusicBrainzSearchProps<T extends MusicBrainzSearchResult> {
  searchFunction: (query: string) => Promise<T[]>;
  initialValue?: string;
  initialName?: string;
}

export const useMusicBrainzSearch = <T extends MusicBrainzSearchResult>({
  searchFunction,
  initialValue,
  initialName,
}: UseMusicBrainzSearchProps<T>) => {
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Initialize with existing value
  const initializeFromValue = useCallback(
    (value: string, name: string) => {
      if (value && !initializedRef.current) {
        setSelectedItem({
          id: value,
          name: name || 'Unknown',
          score: 100,
        } as T);
        initializedRef.current = true;
      }
    },
    [],
  );

  const search = useCallback(
    async (query: string) => {
      if (!query?.trim()) {
        setError('Please enter a search term first');
        return;
      }

      setIsSearching(true);
      setError(null);
      setShowResults(true);

      try {
        const results = await searchFunction(query);
        setSearchResults(results);
        if (results.length === 0) {
          setError('No results found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search MusicBrainz');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchFunction],
  );

  const selectItem = useCallback((item: T) => {
    setSelectedItem(item);
    setShowResults(false);
    setSearchResults([]);
  }, []);

  const clear = useCallback(() => {
    setSelectedItem(null);
    setSearchResults([]);
    setShowResults(false);
    setError(null);
    initializedRef.current = false;
  }, []);

  return {
    searchResults,
    isSearching,
    showResults,
    selectedItem,
    error,
    search,
    selectItem,
    clear,
    initializeFromValue,
  };
};
