const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketServer {
  constructor() {
    this.io = null;
    this.connectedClients = new Set();
  }

  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        socket.user = decoded;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket) => {
      this.connectedClients.add(socket.id);
      console.log(`✓ WebSocket client connected: ${socket.id} (User: ${socket.user?.username || 'Unknown'})`);
      console.log(`  Total connected clients: ${this.connectedClients.size}`);

      // Send initial connection confirmation
      socket.emit('connected', {
        message: 'Connected to QA Dashboard real-time updates',
        clientId: socket.id,
        timestamp: new Date().toISOString()
      });

      // Join user-specific room
      if (socket.user?.username) {
        socket.join(`user:${socket.user.username}`);
      }

      // Handle subscription requests
      socket.on('subscribe', (channel) => {
        socket.join(channel);
        console.log(`  Client ${socket.id} subscribed to: ${channel}`);
      });

      socket.on('unsubscribe', (channel) => {
        socket.leave(channel);
        console.log(`  Client ${socket.id} unsubscribed from: ${channel}`);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.connectedClients.delete(socket.id);
        console.log(`✗ WebSocket client disconnected: ${socket.id} (Reason: ${reason})`);
        console.log(`  Total connected clients: ${this.connectedClients.size}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`WebSocket error for client ${socket.id}:`, error);
      });
    });

    console.log('✅ WebSocket server initialized');
  }

  // Emit process updates
  emitProcessUpdate(process) {
    if (!this.io) return;

    this.io.emit('process:update', {
      id: process.id,
      process_type: process.process_type,
      status: process.status,
      progress: process.progress,
      started_at: process.started_at,
      completed_at: process.completed_at,
      output_path: process.output_path,
      metadata: process.metadata,
      timestamp: new Date().toISOString()
    });
  }

  // Emit process created
  emitProcessCreated(process) {
    if (!this.io) return;

    this.io.emit('process:created', {
      id: process.id,
      process_type: process.process_type,
      status: process.status,
      metadata: process.metadata,
      timestamp: new Date().toISOString()
    });
  }

  // Emit process completed
  emitProcessCompleted(process) {
    if (!this.io) return;

    this.io.emit('process:completed', {
      id: process.id,
      process_type: process.process_type,
      status: process.status,
      completed_at: process.completed_at,
      output_path: process.output_path,
      metadata: process.metadata,
      timestamp: new Date().toISOString()
    });
  }

  // Emit process failed
  emitProcessFailed(process) {
    if (!this.io) return;

    this.io.emit('process:failed', {
      id: process.id,
      process_type: process.process_type,
      status: process.status,
      error_message: process.error_message,
      metadata: process.metadata,
      timestamp: new Date().toISOString()
    });
  }

  // Emit activity log
  emitActivity(activity) {
    if (!this.io) return;

    this.io.emit('activity:new', {
      id: activity.id,
      user: activity.user,
      action: activity.action,
      resource: activity.resource,
      status: activity.status,
      metadata: activity.metadata,
      created_at: activity.created_at,
      timestamp: new Date().toISOString()
    });
  }

  // Emit test result
  emitTestResult(testRun) {
    if (!this.io) return;

    this.io.emit('test:result', {
      id: testRun.id,
      run_id: testRun.run_id,
      website_id: testRun.website_id,
      test_type: testRun.test_type,
      status: testRun.status,
      total_tests: testRun.total_tests,
      passed: testRun.passed,
      failed: testRun.failed,
      duration_ms: testRun.duration_ms,
      timestamp: new Date().toISOString()
    });
  }

  // Emit failure created
  emitFailureCreated(failure) {
    if (!this.io) return;

    this.io.emit('failure:created', {
      id: failure.id,
      title: failure.title,
      priority: failure.priority,
      failure_type: failure.failure_type,
      status: failure.status,
      timestamp: new Date().toISOString()
    });
  }

  // Emit failure updated
  emitFailureUpdated(failure) {
    if (!this.io) return;

    this.io.emit('failure:updated', {
      id: failure.id,
      status: failure.status,
      resolved_at: failure.resolved_at,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast to specific room
  emitToRoom(room, event, data) {
    if (!this.io) return;
    this.io.to(room).emit(event, data);
  }

  // Get connection stats
  getStats() {
    return {
      connectedClients: this.connectedClients.size,
      rooms: this.io ? Array.from(this.io.sockets.adapter.rooms.keys()) : []
    };
  }
}

// Singleton instance
const wsServer = new WebSocketServer();

module.exports = wsServer;
