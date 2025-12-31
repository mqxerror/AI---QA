import { useEffect, useCallback } from 'react';
import wsClient from '../services/websocket';

/**
 * Custom React hook for real-time WebSocket updates
 *
 * @param {string} event - The event name to listen for
 * @param {Function} callback - Callback function to handle the event data
 * @param {Array} dependencies - Dependencies array for the callback
 */
export function useRealtimeUpdates(event, callback, dependencies = []) {
  const memoizedCallback = useCallback(callback, dependencies);

  useEffect(() => {
    if (!wsClient.isConnected()) {
      // Auto-connect if not connected
      wsClient.connect();
    }

    // Subscribe to the event
    const unsubscribe = wsClient.on(event, memoizedCallback);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [event, memoizedCallback]);
}

/**
 * Hook for process updates
 */
export function useProcessUpdates(callback, dependencies = []) {
  useRealtimeUpdates('process:created', callback, dependencies);
  useRealtimeUpdates('process:update', callback, dependencies);
  useRealtimeUpdates('process:completed', callback, dependencies);
  useRealtimeUpdates('process:failed', callback, dependencies);
}

/**
 * Hook for activity updates
 */
export function useActivityUpdates(callback, dependencies = []) {
  useRealtimeUpdates('activity:new', callback, dependencies);
}

/**
 * Hook for test result updates
 */
export function useTestResultUpdates(callback, dependencies = []) {
  useRealtimeUpdates('test:result', callback, dependencies);
}

/**
 * Hook for failure updates
 */
export function useFailureUpdates(callback, dependencies = []) {
  useRealtimeUpdates('failure:created', callback, dependencies);
  useRealtimeUpdates('failure:updated', callback, dependencies);
}

/**
 * Hook to manage WebSocket connection
 */
export function useWebSocketConnection() {
  useEffect(() => {
    // Connect on mount
    wsClient.connect();

    // Disconnect on unmount
    return () => {
      wsClient.disconnect();
    };
  }, []);

  return {
    isConnected: wsClient.isConnected(),
    subscribe: wsClient.subscribe.bind(wsClient),
    unsubscribe: wsClient.unsubscribe.bind(wsClient)
  };
}

export default useRealtimeUpdates;
