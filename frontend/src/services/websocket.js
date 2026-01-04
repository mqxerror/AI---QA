import { io } from 'socket.io-client';

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Cannot connect to WebSocket: No authentication token');
      return;
    }

    // Dynamic URL detection - use same origin in production, localhost in dev
    const getSocketUrl = () => {
      if (typeof window !== 'undefined') {
        const { hostname } = window.location;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'http://localhost:3004';
        }
        // In production, connect via same origin (nginx proxies /socket.io)
        return window.location.origin;
      }
      return 'http://localhost:3004';
    };

    const url = import.meta.env.VITE_API_URL || getSocketUrl();

    this.socket = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log('✓ Connected to WebSocket server');
    });

    this.socket.on('connected', (data) => {
      console.log('WebSocket connection confirmed:', data.message);
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('✗ Disconnected from WebSocket:', reason);
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;
      console.error('WebSocket connection error:', error.message);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Please refresh the page.');
      }
    });

    // Set up default event listeners
    this.setupDefaultListeners();
  }

  setupDefaultListeners() {
    if (!this.socket) return;

    // Process events
    this.socket.on('process:created', (data) => {
      this.emit('process:created', data);
    });

    this.socket.on('process:update', (data) => {
      this.emit('process:update', data);
    });

    this.socket.on('process:completed', (data) => {
      this.emit('process:completed', data);
    });

    this.socket.on('process:failed', (data) => {
      this.emit('process:failed', data);
    });

    // Activity events
    this.socket.on('activity:new', (data) => {
      this.emit('activity:new', data);
    });

    // Test result events
    this.socket.on('test:result', (data) => {
      this.emit('test:result', data);
    });

    // Failure events
    this.socket.on('failure:created', (data) => {
      this.emit('failure:created', data);
    });

    this.socket.on('failure:updated', (data) => {
      this.emit('failure:updated', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
      console.log('WebSocket disconnected');
    }
  }

  subscribe(channel) {
    if (this.socket && this.connected) {
      this.socket.emit('subscribe', channel);
    }
  }

  unsubscribe(channel) {
    if (this.socket && this.connected) {
      this.socket.emit('unsubscribe', channel);
    }
  }

  // Event emitter pattern for React components
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Singleton instance
const wsClient = new WebSocketClient();

export default wsClient;
