import { useState, useCallback } from 'react';
import { api } from '../api/client.js';

export function useApiMutation(path, onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.post(path, data);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [path, onSuccess]);

  return { execute, loading, error };
}