import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = (url, enabled = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = useCallback(() => {
    if (!enabled || !url) return;

    try {
      // Convert http/https to ws/wss
      let wsUrl = url;
      if (url.startsWith('http://')) {
        wsUrl = url.replace('http://', 'ws://');
      } else if (url.startsWith('https://')) {
        wsUrl = url.replace('https://', 'wss://');
      }
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        setLoading(false);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type && message.data) {
            setData(message.data);
            setLoading(false);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
        setLoading(false);
      };

      ws.onclose = () => {
        setConnected(false);
        
        // Attempt to reconnect
        if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Failed to reconnect to WebSocket');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setError('Failed to create WebSocket connection');
      setLoading(false);
    }
  }, [url, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    if (enabled && url) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, url, connect, disconnect]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return { data, loading, error, connected, sendMessage };
};

