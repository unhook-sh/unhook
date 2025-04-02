import http2 from 'node:http2'
import { URL } from 'node:url'

// Define the structure for messages between client and server
interface TunnelRequest {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body?: string // base64
  timestamp: number
}

interface TunnelResponse {
  id: string
  status: number
  headers: Record<string, string>
  body?: string // base64
  timestamp: number
}

interface TunnelClientOptions {
  /**
   * The address of the local service to forward traffic to.
   * Example: "http://localhost:3000"
   */
  localAddr: string
  /**
   * The address of the tunnel server.
   * Example: "https://your-tunnel-server.com/api/tunnel"
   */
  serverAddr: string
  /**
   * A unique identifier for this client instance.
   */
  clientId: string
  /**
   * API key for authentication with the tunnel server.
   * This will be used to identify which tunnel to route traffic to/from.
   */
  apiKey: string
}

/**
 * Starts the tunnel client.
 *
 * Connects to the tunnel server via HTTP/2 and relays HTTP requests
 * between the server and the local service.
 *
 * @param options - Configuration options for the tunnel client.
 * @returns A function to stop the client.
 */
export function startTunnelClient(options: TunnelClientOptions): () => void {
  const { localAddr, serverAddr, clientId, apiKey } = options
  let client: http2.ClientHttp2Session | null = null
  let isStopped = false

  async function connect() {
    if (isStopped) return

    const url = new URL(serverAddr)
    console.log(`[Tunnel Client ${clientId}] Connecting to ${url}...`)

    try {
      // Create HTTP/2 client
      client = http2.connect(url.origin)

      client.on('error', (error) => {
        console.error(`[Tunnel Client ${clientId}] HTTP/2 error:`, error)
        if (!isStopped) {
          // Attempt to reconnect after a delay
          setTimeout(connect, 5000)
        }
      })

      client.on('connect', () => {
        console.log(`[Tunnel Client ${clientId}] Connected to ${serverAddr}`)
        // Start streaming requests
        startRequestStream()
      })

      client.on('close', () => {
        console.log(`[Tunnel Client ${clientId}] Connection closed`)
        if (!isStopped) {
          // Attempt to reconnect after a delay
          setTimeout(connect, 5000)
        }
      })
    } catch (error) {
      console.error(`[Tunnel Client ${clientId}] Connection error:`, error)
      if (!isStopped) {
        // Attempt to reconnect after a delay
        setTimeout(connect, 5000)
      }
    }
  }

  function startRequestStream() {
    if (!client || client.destroyed) return

    const stream = client.request({
      ':method': 'GET',
      ':path': new URL(serverAddr).pathname,
      'x-api-key': apiKey,
      'x-client-id': clientId,
    })

    let buffer = ''

    stream.on('data', (chunk) => {
      buffer += chunk.toString()
      const lines = buffer.split('\n')

      // Keep the last line if it's incomplete
      buffer = lines.pop() || ''

      // Process complete lines
      for (const line of lines) {
        if (!line) continue
        try {
          const message = JSON.parse(line)
          if (message.type === 'request') {
            handleHttpRequest(message.data)
          }
        } catch (error) {
          console.error(
            `[Tunnel Client ${clientId}] Error processing message:`,
            error,
          )
        }
      }
    })

    stream.on('error', (error) => {
      console.error(`[Tunnel Client ${clientId}] Stream error:`, error)
      if (!isStopped) {
        // Attempt to restart the stream
        setTimeout(startRequestStream, 1000)
      }
    })

    stream.on('end', () => {
      console.log(`[Tunnel Client ${clientId}] Stream ended`)
      if (!isStopped) {
        // Attempt to restart the stream
        setTimeout(startRequestStream, 1000)
      }
    })
  }

  async function handleHttpRequest(request: TunnelRequest) {
    const { id, method, url, headers, body } = request
    const targetUrl = new URL(url, localAddr)

    try {
      // Make request to local service
      const response = await fetch(targetUrl.toString(), {
        method,
        headers,
        body: body ? Buffer.from(body, 'base64') : undefined,
      })

      // Read response body as base64
      const responseBody = await response.arrayBuffer()
      const responseBodyBase64 = Buffer.from(responseBody).toString('base64')

      const responseMsg: TunnelResponse = {
        id,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBodyBase64,
        timestamp: Date.now(),
      }

      // Send response back to server using HTTP/2
      if (!client || client.destroyed) {
        throw new Error('HTTP/2 client not connected')
      }

      const responseStream = client.request({
        ':method': 'POST',
        ':path': new URL(serverAddr).pathname,
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'x-client-id': clientId,
        'x-tunnel-action': 'response',
      })

      responseStream.write(JSON.stringify(responseMsg))
      responseStream.end()

      console.log(
        `[Tunnel Client ${clientId}] Responded to request ${id} with status ${response.status}`,
      )
    } catch (error) {
      console.error(
        `[Tunnel Client ${clientId}] Error forwarding request ${id} to ${targetUrl.toString()}:`,
        error,
      )

      // Send error response back to server
      if (!client || client.destroyed) {
        console.error('Cannot send error response: HTTP/2 client not connected')
        return
      }

      const errorStream = client.request({
        ':method': 'POST',
        ':path': new URL(serverAddr).pathname,
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'x-client-id': clientId,
        'x-tunnel-action': 'response',
      })

      errorStream.write(
        JSON.stringify({
          type: 'response',
          id,
          status: 500,
          headers: { 'content-type': 'text/plain' },
          body: Buffer.from(
            error instanceof Error ? error.message : 'Internal error',
          ).toString('base64'),
          timestamp: Date.now(),
        }),
      )
      errorStream.end()
    }
  }

  // Start the initial connection
  connect()

  // Return a function to stop the client
  return () => {
    if (isStopped) return
    console.log(`[Tunnel Client ${clientId}] Stopping...`)
    isStopped = true
    if (client) {
      client.close()
      client = null
    }
    console.log(`[Tunnel Client ${clientId}] Stopped.`)
  }
}
