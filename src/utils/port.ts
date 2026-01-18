/**
 * Port management utilities.
 */
import { createServer } from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Check if a port is available.
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, '127.0.0.1');
  });
}

/**
 * Find the process using a port (Unix-like systems).
 */
export async function findProcessOnPort(port: number): Promise<number | null> {
  try {
    const { stdout } = await execAsync(`lsof -i :${port} -t`);
    const pid = parseInt(stdout.trim().split('\n')[0], 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

/**
 * Kill process on a port if one exists.
 */
export async function killProcessOnPort(port: number): Promise<boolean> {
  const pid = await findProcessOnPort(port);
  if (pid === null) {
    return false;
  }

  try {
    process.kill(pid, 'SIGTERM');
    // Wait a bit for process to terminate
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for a port to become available.
 */
export async function waitForPort(
  port: number,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await isPortAvailable(port)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return false;
}
