import { useEffect, useRef, useState, useCallback } from 'react';
import { websocketService } from '../services/websocketService';
import { useAuth } from '../store/slices/authSlice';

export interface WebSocketState {
  isConnected: boolean;
  readyState: number;
  error: string | null;
}

export const useWebSocket = () => {
  const { token } = useAuth();
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    readyState: WebSocket.CLOSED,
    error: null,
  });

  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!token) {
      setState(prev => ({ ...prev, error: 'No authentication token available' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      await websocketService.connect(token);
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to connect to WebSocket' 
      }));
    }
  }, [token]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  // Subscribe to deployment status updates
  const onDeploymentStatus = useCallback((handler: (data: any) => void) => {
    const unsubscribe = websocketService.onDeploymentStatus(handler);
    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // Subscribe to infrastructure updates
  const onInfrastructureUpdate = useCallback((handler: (data: any) => void) => {
    const unsubscribe = websocketService.onInfrastructureUpdate(handler);
    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // Subscribe to metrics updates
  const onMetricsUpdate = useCallback((handler: (data: any) => void) => {
    const unsubscribe = websocketService.onMetricsUpdate(handler);
    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // Subscribe to alert notifications
  const onAlert = useCallback((handler: (data: any) => void) => {
    const unsubscribe = websocketService.onAlert(handler);
    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // Subscribe to system messages
  const onSystemMessage = useCallback((handler: (data: any) => void) => {
    const unsubscribe = websocketService.onSystemMessage(handler);
    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // Subscribe to any message type
  const subscribe = useCallback((messageType: string, handler: (data: any) => void) => {
    const unsubscribe = websocketService.subscribe(messageType, handler);
    unsubscribeRefs.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  // Send a message
  const send = useCallback((message: any) => {
    websocketService.send(message);
  }, []);

  // Send ping
  const sendPing = useCallback(() => {
    websocketService.sendPing();
  }, []);

  // Update state when WebSocket status changes
  useEffect(() => {
    const updateState = () => {
      setState({
        isConnected: websocketService.isConnected,
        readyState: websocketService.readyState,
        error: null,
      });
    };

    // Initial state
    updateState();

    // Set up interval to check connection status
    const interval = setInterval(updateState, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Connect when token is available
  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      // Clean up subscriptions
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [token, connect, disconnect]);

  return {
    ...state,
    isInSimulationMode: websocketService.isInSimulationMode,
    connect,
    disconnect,
    onDeploymentStatus,
    onInfrastructureUpdate,
    onMetricsUpdate,
    onAlert,
    onSystemMessage,
    subscribe,
    send,
    sendPing,
  };
}; 