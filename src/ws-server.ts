/**
 * WebSocket server for Chrome extension communication.
 */
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './utils/logger.js';
import type { ExtensionMessage, ExtensionResponse } from './types.js';

export interface WSServerOptions {
  port: number;
  onConnection?: (ws: WebSocket) => void;
  onDisconnection?: () => void;
  onMessage?: (message: ExtensionResponse) => void;
}

export interface WSServer {
  server: WebSocketServer;
  getConnection(): WebSocket | null;
  send(message: ExtensionMessage): Promise<ExtensionResponse>;
  close(): Promise<void>;
}

/**
 * Create a WebSocket server for extension communication.
 */
export function createWSServer(options: WSServerOptions): WSServer {
  const { port, onConnection, onDisconnection, onMessage } = options;

  let connection: WebSocket | null = null;
  const pendingRequests = new Map<string, {
    resolve: (response: ExtensionResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();

  const server = new WebSocketServer({ port, host: '127.0.0.1' });

  logger.info(`WebSocket server listening on ws://127.0.0.1:${port}`);

  server.on('connection', (ws) => {
    logger.info('Extension connected');

    // Only allow one connection at a time
    if (connection && connection.readyState === WebSocket.OPEN) {
      logger.warn('Closing existing connection for new one');
      connection.close();
    }

    connection = ws;
    onConnection?.(ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as ExtensionResponse;
        logger.debug('Received message', message);

        // Handle response to a pending request
        if (message.id && pendingRequests.has(message.id)) {
          const pending = pendingRequests.get(message.id)!;
          clearTimeout(pending.timeout);
          pendingRequests.delete(message.id);
          pending.resolve(message);
        }

        onMessage?.(message);
      } catch (err) {
        logger.error('Failed to parse message', err);
      }
    });

    ws.on('close', () => {
      logger.info('Extension disconnected');
      if (connection === ws) {
        connection = null;
      }
      onDisconnection?.();
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error', err);
    });
  });

  server.on('error', (err) => {
    logger.error('WebSocket server error', err);
  });

  return {
    server,

    getConnection() {
      return connection;
    },

    send(message: ExtensionMessage): Promise<ExtensionResponse> {
      return new Promise((resolve, reject) => {
        if (!connection || connection.readyState !== WebSocket.OPEN) {
          reject(new Error('No extension connected'));
          return;
        }

        const timeout = setTimeout(() => {
          pendingRequests.delete(message.id);
          reject(new Error(`Request timed out: ${message.type}`));
        }, 30000);

        pendingRequests.set(message.id, { resolve, reject, timeout });

        logger.debug('Sending message', message);
        connection.send(JSON.stringify(message));
      });
    },

    close(): Promise<void> {
      return new Promise((resolve) => {
        // Clear all pending requests
        for (const [id, pending] of pendingRequests) {
          clearTimeout(pending.timeout);
          pending.reject(new Error('Server closing'));
          pendingRequests.delete(id);
        }

        // Close connection
        if (connection) {
          connection.close();
          connection = null;
        }

        // Close server
        server.close(() => {
          logger.info('WebSocket server closed');
          resolve();
        });
      });
    },
  };
}
