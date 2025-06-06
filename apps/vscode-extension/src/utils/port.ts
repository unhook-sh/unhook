import * as net from 'node:net';

export async function findAvailablePort(
  startPort = 3000,
  maxPort = 9000,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        if (startPort < maxPort) {
          resolve(findAvailablePort(startPort + 1, maxPort));
        } else {
          reject(new Error('No available ports found'));
        }
      } else {
        reject(err);
      }
    });

    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
  });
}
