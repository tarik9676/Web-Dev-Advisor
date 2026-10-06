import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../api/client.js';

export function useApiData(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    abortRef.current = false;
    try {
      const result = await fetchFn();
      if (!abortRef.current) {
        setData(result);
      }
    } catch (err) {
      if (!abortRef.current) {
        setError(err);
      }
    } finally {
      if (!abortRef.current) {
        setLoading(false);
      }
    }
  }, deps);

  useEffect(() => {
    load();
  }, deps);

  return { data, loading, error, refetch: load };
}