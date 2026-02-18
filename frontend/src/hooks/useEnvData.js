import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../services/api';

export default function useEnvData(city, location) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!city || !location) return;

    setLoading(true);
    setError(null);

    try {
      const result = await dashboardAPI.getSummary(city, location);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [city, location]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}
