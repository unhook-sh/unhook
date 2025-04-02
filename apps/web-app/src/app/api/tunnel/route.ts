import { kv } from '@vercel/kv'
import { type NextRequest, NextResponse } from 'next/server'

// Mark as edge runtime to support HTTP/2
export const runtime = 'edge'

interface TunnelRequest {
  method: string
  url: string
  headers: Record<string, string>
  body?: string
}

interface TunnelResponse {
  status: number
  headers: Record<string, string>
  body?: string
}

// Cleanup stale clients every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
const CLIENT_TIMEOUT = 30 * 1000

async function cleanupStaleClients() {
  const now = Date.now()
  const clients = await kv.hgetall<Record<string, string>>('tunnel:clients')
  if (!clients) return

  for (const [clientKey, lastSeenStr] of Object.entries(clients)) {
    const lastSeen = Number.parseInt(lastSeenStr as string, 10)
    if (now - lastSeen > CLIENT_TIMEOUT) {
      await kv.hdel('tunnel:clients', clientKey)
    }
  }
}

// Run cleanup periodically
setInterval(cleanupStaleClients, CLEANUP_INTERVAL)

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) {
    return new NextResponse('API key required', { status: 401 })
  }

  const isValidKey = await kv.sismember('tunnel:api_keys', apiKey)
  if (!isValidKey) {
    return new NextResponse('Invalid API key', { status: 401 })
  }

  const clientId = req.headers.get('x-client-id')
  if (!clientId) {
    return new NextResponse('Client ID required', { status: 400 })
  }

  const clientKey = `${apiKey}:${clientId}`

  // Set up HTTP/2 stream
  const transformer = new TransformStream()
  const writer = transformer.writable.getWriter()
  const encoder = new TextEncoder()

  // Register client
  await kv.hset('tunnel:clients', { [clientKey]: Date.now().toString() })

  // Send initial connection message
  await writer.write(
    encoder.encode(`${JSON.stringify({ type: 'connected' })}\n`),
  )

  // Poll for new requests
  const pollInterval = setInterval(async () => {
    try {
      // Update last seen timestamp
      await kv.hset('tunnel:clients', { [clientKey]: Date.now().toString() })

      // Check for new requests
      const request = await kv.lpop(`tunnel:requests:${clientKey}`)
      if (request) {
        await writer.write(
          encoder.encode(
            `${JSON.stringify({ type: 'request', data: request })}\n`,
          ),
        )
      }
    } catch (error) {
      console.error('Error polling for requests:', error)
      clearInterval(pollInterval)
      writer.close()
    }
  }, 1000)

  // Cleanup when connection closes
  req.signal.addEventListener('abort', () => {
    clearInterval(pollInterval)
    writer.close()
    kv.hdel('tunnel:clients', clientKey).catch(console.error)
  })

  return new NextResponse(transformer.readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  })
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) {
    return new NextResponse('API key required', { status: 401 })
  }

  const isValidKey = await kv.sismember('tunnel:api_keys', apiKey)
  if (!isValidKey) {
    return new NextResponse('Invalid API key', { status: 401 })
  }

  const action = req.headers.get('x-tunnel-action')
  if (!action) {
    return new NextResponse('Action required', { status: 400 })
  }

  switch (action) {
    case 'create-api-key': {
      const newApiKey = crypto.randomUUID()
      await kv.sadd('tunnel:api_keys', newApiKey)
      return NextResponse.json({ apiKey: newApiKey })
    }

    case 'list-clients': {
      const clients = await kv.hgetall<Record<string, string>>('tunnel:clients')
      const activeClients = Object.entries(clients ?? {})
        .filter(([key]) => key.startsWith(`${apiKey}:`))
        .map(([key]) => key.split(':')[1])
      return NextResponse.json({ clients: activeClients })
    }

    case 'request': {
      const clientId = req.headers.get('x-client-id')
      if (!clientId) {
        return new NextResponse('Client ID required', { status: 400 })
      }

      const clientKey = `${apiKey}:${clientId}`
      const isClientConnected = await kv.hexists('tunnel:clients', clientKey)
      if (!isClientConnected) {
        return new NextResponse('Client not connected', { status: 404 })
      }

      const request: TunnelRequest = await req.json()
      await kv.rpush(`tunnel:requests:${clientKey}`, request)

      // Wait for response with timeout
      const timeout = 30000 // 30 seconds
      const startTime = Date.now()

      while (Date.now() - startTime < timeout) {
        const response = await kv.lpop<TunnelResponse>(
          `tunnel:responses:${clientKey}`,
        )
        if (response) {
          return new NextResponse(response.body, {
            status: response.status,
            headers: response.headers,
          })
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      return new NextResponse('Request timeout', { status: 504 })
    }

    case 'response': {
      const clientId = req.headers.get('x-client-id')
      if (!clientId) {
        return new NextResponse('Client ID required', { status: 400 })
      }

      const clientKey = `${apiKey}:${clientId}`
      const response: TunnelResponse = await req.json()
      await kv.rpush(`tunnel:responses:${clientKey}`, response)
      return new NextResponse('OK')
    }

    default:
      return new NextResponse('Invalid action', { status: 400 })
  }
}
