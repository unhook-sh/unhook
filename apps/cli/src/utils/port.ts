import { createServer } from 'node:net';

export function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    server.once('error', () => {
      resolve(false);
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port);
  });
}

export async function findAvailablePort(startPort = 54321): Promise<number> {
  let port = startPort;
  const maxPort = 65535;

  while (port <= maxPort) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }

  throw new Error('No available ports found');
}
