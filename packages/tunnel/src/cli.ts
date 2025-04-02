#!/usr/bin/env node

import crypto from 'node:crypto'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { startTunnelClient } from './index.js' // Use .js extension for module compatibility

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('local-addr', {
      alias: 'l',
      type: 'string',
      description: 'Address of the local service (e.g., http://localhost:3000)',
      demandOption: true,
    })
    .option('server-addr', {
      alias: 's',
      type: 'string',
      description:
        'WebSocket address of the tunnel server (e.g., wss://your-tunnel-server.com)',
      demandOption: true,
    })
    .option('api-key', {
      alias: 'k',
      type: 'string',
      description: 'API key for authentication with the tunnel server',
      demandOption: true,
      // Can also be provided via TUNNEL_API_KEY environment variable
      default: process.env.TUNNEL_API_KEY,
    })
    .option('client-id', {
      alias: 'c',
      type: 'string',
      description: 'Unique client identifier (default: auto-generated)',
      default: `client_${crypto.randomBytes(8).toString('hex')}`,
    })
    .usage(
      'Usage: $0 -l <local-addr> -s <server-addr> -k <api-key> [-c <client-id>]',
    )
    .help()
    .alias('help', 'h')
    .parseAsync()

  if (!argv.apiKey) {
    console.error(
      'API key is required. Provide it via --api-key or TUNNEL_API_KEY environment variable.',
    )
    process.exit(1)
  }

  console.log(`Starting tunnel client with ID: ${argv.clientId}`)
  console.log(`Forwarding to local service: ${argv.localAddr}`)
  console.log(`Connecting to tunnel server: ${argv.serverAddr}`)

  try {
    const stopClient = startTunnelClient({
      localAddr: argv.localAddr,
      serverAddr: argv.serverAddr,
      clientId: argv.clientId,
      apiKey: argv.apiKey,
    })

    console.log('Tunnel client started. Press Ctrl+C to exit.')

    // Keep the process alive. The WebSocket connection itself
    // should keep it running, but this makes it explicit.
    process.stdin.resume()

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\nCaught interrupt signal, shutting down client...')
      stopClient()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      console.log('Caught termination signal, shutting down client...')
      stopClient()
      process.exit(0)
    })
  } catch (error) {
    console.error('Failed to start tunnel client:', error)
    process.exit(1)
  }
}

void main()
