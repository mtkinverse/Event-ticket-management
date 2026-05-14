import { useState, useEffect, useCallback } from 'react';
import { waitlistApi } from '../services/api/waitlist.js';
import { useAuth } from './useAuth.js';

export const useMyWaitlist = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const refresh = useCallback(() => {
    if (!user) return Promise.resolve();
    setLoading(true);
    return waitlistApi.getMy()
      .then(setEntries)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const leave = async (eventId) => {
    setPendingId(eventId);
    try {
      await waitlistApi.leave(eventId);
      await refresh();
    } finally {
      setPendingId(null);
    }
  };

  const isOnWaitlist = (eventId) => entries.some(e => e.eventId === eventId);

  return { entries, loading, error, leave, pendingId, refresh, isOnWaitlist };
};
