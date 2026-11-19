import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'HEALTHY',
    service: 'NyayaSetu India National Platform',
    timestamp: new Date().toISOString(),
    deployment: 'Vercel Serverless Edge',
    database: 'Neon PostgreSQL Active',
  });
}

