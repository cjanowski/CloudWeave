import type { WebSocketMessage, WebSocketError } from '../types/api';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private isConnecting = false;
  private token: string | null = null;

  constructor(private url: string) {}

  // Connect to WebSocket server
  async connect(token: string): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    this.token = token;

    try {
      // Add token to URL for authentication
      const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Send initial ping
        this.sendPing();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.handleDisconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.isConnecting = false;
      this.handleDisconnect();
    }
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.isConnecting = false;
  }

  // Send a message to the server
  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  // Send ping message
  sendPing(): void {
    this.send({
      type: 'ping',
      data: {},
      timestamp: new Date().toISOString(),
    });
  }

  // Subscribe to a specific message type
  subscribe(messageType: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    
    this.messageHandlers.get(messageType)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  // Subscribe to deployment status updates
  onDeploymentStatus(handler: (data: any) => void): () => void {
    return this.subscribe('deployment_status', handler);
  }

  // Subscribe to infrastructure updates
  onInfrastructureUpdate(handler: (data: any) => void): () => void {
    return this.subscribe('infrastructure_update', handler);
  }

  // Subscribe to metrics updates
  onMetricsUpdate(handler: (data: any) => void): () => void {
    return this.subscribe('metrics_update', handler);
  }

  // Subscribe to alert notifications
  onAlert(handler: (data: any) => void): () => void {
    return this.subscribe('alert_notification', handler);
  }

  // Subscribe to system messages
  onSystemMessage(handler: (data: any) => void): () => void {
    return this.subscribe('system_message', handler);
  }

  // Handle incoming messages
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      // Handle different message types
      switch (message.type) {
        case 'pong':
          // Handle pong response
          console.log('Received pong from server');
          break;
          
        case 'error':
          const error = message.data as WebSocketError;
          console.error('WebSocket error:', error.message);
          break;
          
        default:
          // Notify subscribers
          const handlers = this.messageHandlers.get(message.type);
          if (handlers) {
            handlers.forEach(handler => {
              try {
                handler(message.data);
              } catch (error) {
                console.error('Error in message handler:', error);
              }
            });
          }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  // Handle disconnection and attempt reconnection
  private handleDisconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts++;
      
      if (this.token) {
        this.connect(this.token);
      }
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
  }

  // Get connection status
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Get connection state
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Create singleton instance
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/api/v1/ws';
export const websocketService = new WebSocketService(wsUrl); 