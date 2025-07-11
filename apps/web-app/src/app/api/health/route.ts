import { type NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  const health = {
    environment: process.env.NODE_ENV || 'development',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(health, { status: 200 });
}
