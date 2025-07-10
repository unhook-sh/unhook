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
        currentTime: new Date().toISOString(),
        error: 'Request expired',
        message: 'Request timestamp is over 300 seconds old',
        status: 410,
        timeDiffMs: Math.round(timeDiff),
        timestamp: requestTimestamp,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
        status: 410,
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
      currentTime: new Date().toISOString(),
      message: 'Request received',
      received: true,
      status: statusCode,
      timeDiffMs: Math.round(timeDiff),
      timestamp: requestTimestamp,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      status: statusCode,
    },
  );
}
