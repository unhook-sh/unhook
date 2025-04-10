export async function POST(request: Request) {
  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status');

  // Parse the request body
  const body = await request.json();
  const requestTimestamp = body.timestamp;

  // Calculate time difference if timestamp exists
  let timeDiff = 0;
  if (requestTimestamp) {
    timeDiff = (Date.now() - new Date(requestTimestamp).getTime()) / 1000;
  }

  // Check if timestamp exists and validate time difference
  if (requestTimestamp && timeDiff > 300) {
    return new Response(
      JSON.stringify({
        status: 410,
        error: 'Request expired',
        message: 'Request timestamp is over 300 seconds old',
        timestamp: requestTimestamp,
        currentTime: new Date().toISOString(),
        timeDiffMs: Math.round(timeDiff),
      }),
      {
        status: 410,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  // Default to 200 if no status provided
  let statusCode = 200;

  if (statusParam) {
    const parsedStatus = Number.parseInt(statusParam, 10);

    // Validate status code is within valid HTTP status code range
    if (
      !Number.isNaN(parsedStatus) &&
      parsedStatus >= 100 &&
      parsedStatus <= 599
    ) {
      statusCode = parsedStatus;
    }
  }

  return new Response(
    JSON.stringify({
      status: statusCode,
      message: 'Request received',
      timestamp: requestTimestamp,
      currentTime: new Date().toISOString(),
      received: true,
      timeDiffMs: Math.round(timeDiff),
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}
