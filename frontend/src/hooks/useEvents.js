import { useState, useEffect, useCallback } from 'react';
import { eventsApi } from '../services/api/events.js';

export const useEvents = (initialFilters = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventsApi.getAll(filters);
      setEvents(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return { events, loading, error, filters, setFilters, reload: fetch };
};

export const useFeaturedEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi.getFeatured().then(setEvents).finally(() => setLoading(false));
  }, []);

  return { events, loading };
};

export const useEvent = (id) => {
  const [event, setEvent] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([eventsApi.getById(id), eventsApi.getRelated(id)])
      .then(([ev, rel]) => { setEvent(ev); setRelated(rel); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { event, related, loading, error };
};

export const useOrganizerEvents = (organizerId) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await eventsApi.getByOrganizer(organizerId);
    setEvents(data);
    setLoading(false);
  }, [organizerId]);

  useEffect(() => { if (organizerId) reload(); }, [organizerId, reload]);

  return { events, loading, reload };
};

export const usePendingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await eventsApi.getPending();
    setEvents(data);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { events, loading, reload };
};
