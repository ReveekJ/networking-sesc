import { useState, useEffect, useRef } from 'react';

export const usePolling = (pollingFunction, interval = 5000, enabled = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      try {
        const result = await pollingFunction();
        setData(result.data);
        setError(null);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollingFunction, interval, enabled]);

  return { data, loading, error };
};

