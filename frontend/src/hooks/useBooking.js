import { useState, useEffect } from 'react';
import { bookingsApi } from '../services/api/bookings.js';
import { useAuth } from './useAuth.js';

export const useMyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const refresh = () => {
    if (!user) return Promise.resolve();
    setLoading(true);
    return bookingsApi.getMyBookings()
      .then(setBookings)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, [user]);

  const cancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      await bookingsApi.cancel(bookingId);
      await refresh();
    } finally {
      setCancellingId(null);
    }
  };

  return { bookings, loading, error, cancel, cancellingId, refresh };
};

export const useBookEvent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const book = async ({ eventId, quantity }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingsApi.create({ eventId, quantity });
      setResult(data);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const joinWaitlist = async (eventId) => {
    setLoading(true);
    try {
      const data = await bookingsApi.joinWaitlist({ eventId });
      setResult(data);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { book, joinWaitlist, loading, error, result };
};
