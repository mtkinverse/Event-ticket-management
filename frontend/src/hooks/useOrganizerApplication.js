import { useState, useEffect, useCallback } from 'react';
import { organizerApplicationsApi } from '../services/api/organizer_applications.js';
import { useAuth } from './useAuth.js';

export const useMyApplication = () => {
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    if (!user || user.role !== 'customer') {
      setApplication(null);
      return Promise.resolve();
    }
    setLoading(true);
    return organizerApplicationsApi.getMine()
      .then(setApplication)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { application, loading, error, refresh };
};

export const usePendingApplications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    return organizerApplicationsApi.listPending()
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const approve = async (id) => {
    setPendingId(id);
    try { await organizerApplicationsApi.approve(id); await refresh(); }
    finally { setPendingId(null); }
  };
  const reject = async (id, reason) => {
    setPendingId(id);
    try { await organizerApplicationsApi.reject(id, reason); await refresh(); }
    finally { setPendingId(null); }
  };

  return { items, loading, error, approve, reject, pendingId, refresh };
};
