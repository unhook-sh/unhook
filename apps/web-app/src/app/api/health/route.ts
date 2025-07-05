import { type NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  return NextResponse.json(health, { status: 200 });
}
