import { useState, useCallback } from 'react';
import type { DJ, DJApiResponse, DJsApiResult } from '../types';

export const useDJOrder = () => {
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadDJs = useCallback(async () => {
    try {
      const response = await fetch('/api/djs?limit=100&sort=sortOrder&where[onAir][equals]=true');
      if (!response.ok) {
        throw new Error('Failed to fetch DJs');
      }
      const data: DJsApiResult = await response.json();
      const fetchedDjs: DJ[] = data.docs.map((dj: DJApiResponse) => ({
        id: String(dj.id),
        displayName: dj.displayName || `DJ #${dj.id}`,
        sortOrder: dj.sortOrder ?? 0,
        onAir: dj.onAir ?? true,
      }));
      setDjs(fetchedDjs);
      setError(null);
    } catch (err) {
      setError('Error loading DJs. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Error fetching DJs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveOrder = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Update each DJ with its new sortOrder
      // Include _status and onAir to preserve existing values when drafts are enabled
      const updatePromises = djs.map((dj, index) => fetch(`/api/djs/${dj.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sortOrder: index,
          onAir: dj.onAir,
          _status: 'published',
        }),
      }));

      await Promise.all(updatePromises);
      setSuccessMessage('DJ order saved successfully!');
    } catch (err) {
      setError('Error saving DJ order. Please try again.');
      // eslint-disable-next-line no-console
      console.error('Error saving DJ order:', err);
    } finally {
      setSaving(false);
    }
  }, [djs]);

  const clearSuccessMessage = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return {
    djs,
    setDjs,
    loading,
    saving,
    error,
    successMessage,
    loadDJs,
    saveOrder,
    clearSuccessMessage,
  };
};
