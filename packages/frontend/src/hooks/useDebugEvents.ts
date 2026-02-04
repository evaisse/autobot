import { useState, useEffect, useCallback } from 'react';
import { DebugEvent } from '../types';

/**
 * Hook to manage WebSocket connection for real-time debug events
 */
export function useDebugEvents() {
  const [debugEvents, setDebugEvents] = useState<DebugEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'debug_events') {
          setDebugEvents(prev => [...prev, ...data.events]);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const clearEvents = useCallback(() => {
    setDebugEvents([]);
  }, []);

  return { debugEvents, connected, clearEvents };
}
