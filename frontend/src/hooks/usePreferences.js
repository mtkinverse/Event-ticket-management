import { useState, useEffect, useCallback } from 'react';
import { preferencesApi } from '../services/api/preferences.js';
import { useAuth } from './useAuth.js';

export const usePreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!user) return Promise.resolve();
    setLoading(true);
    return preferencesApi.list()
      .then(setPreferences)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const setMuted = async (type, muted) => {
    setSavingType(type);
    try {
      await preferencesApi.set(type, muted);
      setPreferences(prev => prev.map(p => p.type === type ? { ...p, muted } : p));
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setSavingType(null);
    }
  };

  return { preferences, loading, error, setMuted, savingType, refresh };
};
