/**
 * Context manager for WebSocket communication with the extension.
 */
import { randomUUID } from 'crypto';
import { createWSServer, type WSServer } from './ws-server.js';
import { logger } from './utils/logger.js';
import type { Context, ToolName, ExtensionResponse } from './types.js';

export interface ContextOptions {
  port: number;
}

export interface ContextManager extends Context {
  wsServer: WSServer;
  waitForConnection(timeout?: number): Promise<void>;
  close(): Promise<void>;
}

/**
 * Create a context manager for tool execution.
 */
export function createContext(options: ContextOptions): ContextManager {
  const { port } = options;

  let connectionPromise: Promise<void> | null = null;
  let connectionResolve: (() => void) | null = null;

  const wsServer = createWSServer({
    port,
    onConnection: () => {
      if (connectionResolve) {
        connectionResolve();
        connectionResolve = null;
        connectionPromise = null;
      }
    },
    onDisconnection: () => {
      logger.warn('Extension disconnected, waiting for reconnection...');
    },
  });

  return {
    wsServer,

    isConnected(): boolean {
      return wsServer.getConnection() !== null;
    },

    async send(type: ToolName, payload: Record<string, unknown> = {}): Promise<ExtensionResponse> {
      const id = randomUUID();
      return wsServer.send({ id, type, payload });
    },

    waitForConnection(timeout: number = 30000): Promise<void> {
      if (this.isConnected()) {
        return Promise.resolve();
      }

      if (connectionPromise) {
        return connectionPromise;
      }

      connectionPromise = new Promise((resolve, reject) => {
        connectionResolve = resolve;

        const timer = setTimeout(() => {
          connectionResolve = null;
          connectionPromise = null;
          reject(new Error('Timeout waiting for extension connection'));
        }, timeout);

        // Clear timeout if connection succeeds
        const originalResolve = connectionResolve;
        connectionResolve = () => {
          clearTimeout(timer);
          originalResolve?.();
        };
      });

      return connectionPromise;
    },

    async close(): Promise<void> {
      await wsServer.close();
    },
  };
}
