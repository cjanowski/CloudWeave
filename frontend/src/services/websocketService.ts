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
  private simulationTimers: Map<string, NodeJS.Timeout> = new Map();
  private isSimulationMode = false;

  constructor(private url: string) {}

  // Connect to WebSocket server with fallback to simulation
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

      // Set a timeout for connection
      const connectionTimeout = setTimeout(() => {
        if (this.isConnecting) {
          console.warn('WebSocket connection timeout, falling back to simulation mode');
          this.ws?.close();
          this.startSimulationMode();
        }
      }, 5000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.isSimulationMode = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Stop simulation mode if it was running
        this.stopSimulationMode();
        
        // Send initial ping
        this.sendPing();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        
        // Check if we should fall back to simulation
        if (this.shouldFallbackToSimulation(event.code)) {
          this.startSimulationMode();
        } else {
          this.handleDisconnect();
        }
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        
        // Fall back to simulation mode on error
        this.startSimulationMode();
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.isConnecting = false;
      this.startSimulationMode();
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

    this.stopSimulationMode();
    this.isConnecting = false;
    this.isSimulationMode = false;
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

  // Simulation mode methods
  private shouldFallbackToSimulation(closeCode: number): boolean {
    // Fall back to simulation for connection errors, server unavailable, etc.
    return closeCode !== 1000 && closeCode !== 1001; // Not normal closure or going away
  }

  private startSimulationMode(): void {
    if (this.isSimulationMode) return;
    
    console.log('Starting WebSocket simulation mode');
    this.isSimulationMode = true;
    this.isConnecting = false;

    // Simulate periodic updates
    this.simulateDeploymentUpdates();
    this.simulateInfrastructureUpdates();
    this.simulateMetricsUpdates();
    this.simulateAlertUpdates();
  }

  private stopSimulationMode(): void {
    if (!this.isSimulationMode) return;
    
    console.log('Stopping WebSocket simulation mode');
    this.isSimulationMode = false;
    
    // Clear all simulation timers
    this.simulationTimers.forEach(timer => clearTimeout(timer));
    this.simulationTimers.clear();
  }

  private simulateDeploymentUpdates(): void {
    const simulate = () => {
      if (!this.isSimulationMode) return;
      
      const deploymentStatuses = ['running', 'completed', 'failed'];
      const randomStatus = deploymentStatuses[Math.floor(Math.random() * deploymentStatuses.length)];
      
      const mockData = {
        deploymentId: `demo-deployment-${Date.now()}`,
        status: randomStatus,
        progress: randomStatus === 'completed' ? 100 : Math.floor(Math.random() * 90 + 10),
        message: `Deployment ${randomStatus}`,
        timestamp: new Date().toISOString(),
      };

      this.notifyHandlers('deployment_status', mockData);
      
      // Schedule next update
      const timer = setTimeout(simulate, 30000 + Math.random() * 30000); // 30-60 seconds
      this.simulationTimers.set('deployment', timer);
    };
    
    // Start with initial delay
    const timer = setTimeout(simulate, 5000);
    this.simulationTimers.set('deployment', timer);
  }

  private simulateInfrastructureUpdates(): void {
    const simulate = () => {
      if (!this.isSimulationMode) return;
      
      const infrastructureStatuses = ['running', 'stopped', 'pending'];
      const randomStatus = infrastructureStatuses[Math.floor(Math.random() * infrastructureStatuses.length)];
      
      const mockData = {
        infrastructureId: `demo-infra-${Date.now()}`,
        status: randomStatus,
        message: `Infrastructure status changed to ${randomStatus}`,
        timestamp: new Date().toISOString(),
      };

      this.notifyHandlers('infrastructure_update', mockData);
      
      // Schedule next update
      const timer = setTimeout(simulate, 45000 + Math.random() * 45000); // 45-90 seconds
      this.simulationTimers.set('infrastructure', timer);
    };
    
    // Start with initial delay
    const timer = setTimeout(simulate, 10000);
    this.simulationTimers.set('infrastructure', timer);
  }

  private simulateMetricsUpdates(): void {
    const simulate = () => {
      if (!this.isSimulationMode) return;
      
      const mockData = {
        resourceId: 'demo-web-server-1',
        metrics: {
          cpuUtilization: Math.random() * 100,
          memoryUtilization: Math.random() * 100,
          networkIn: Math.random() * 1000,
          networkOut: Math.random() * 1000,
        },
        timestamp: new Date().toISOString(),
      };

      this.notifyHandlers('metrics_update', mockData);
      
      // Schedule next update
      const timer = setTimeout(simulate, 15000 + Math.random() * 15000); // 15-30 seconds
      this.simulationTimers.set('metrics', timer);
    };
    
    // Start with initial delay
    const timer = setTimeout(simulate, 2000);
    this.simulationTimers.set('metrics', timer);
  }

  private simulateAlertUpdates(): void {
    const simulate = () => {
      if (!this.isSimulationMode) return;
      
      const alertTypes = ['performance', 'security', 'cost', 'availability'];
      const severities = ['info', 'warning', 'error'];
      
      const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
      
      const mockData = {
        id: `demo-alert-${Date.now()}`,
        type: randomType,
        severity: randomSeverity,
        title: `${randomType.charAt(0).toUpperCase() + randomType.slice(1)} Alert`,
        message: `A ${randomSeverity} ${randomType} alert has been triggered`,
        timestamp: new Date().toISOString(),
      };

      this.notifyHandlers('alert_notification', mockData);
      
      // Schedule next update (less frequent for alerts)
      const timer = setTimeout(simulate, 120000 + Math.random() * 180000); // 2-5 minutes
      this.simulationTimers.set('alerts', timer);
    };
    
    // Start with initial delay
    const timer = setTimeout(simulate, 30000);
    this.simulationTimers.set('alerts', timer);
  }

  private notifyHandlers(messageType: string, data: any): void {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in simulated message handler:', error);
        }
      });
    }
  }

  // Get connection status (including simulation mode)
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN || this.isSimulationMode;
  }

  // Get connection state
  get readyState(): number {
    if (this.isSimulationMode) {
      return WebSocket.OPEN; // Simulate connected state
    }
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  // Check if in simulation mode
  get isInSimulationMode(): boolean {
    return this.isSimulationMode;
  }
}

// Create singleton instance
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/api/v1/ws';
export const websocketService = new WebSocketService(wsUrl); 