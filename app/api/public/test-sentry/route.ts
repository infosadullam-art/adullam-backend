import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  console.log("✅ Test Sentry endpoint called (App Router)");
  
  Sentry.captureMessage("🧪 Test Sentry OK - Public (App Router)", {
    level: 'info',
    tags: { test: 'app-router' }
  });

  return NextResponse.json({ 
    success: true, 
    message: "Sentry test réussi ! (App Router)",
    dsn: process.env.SENTRY_DSN ? "✅" : "❌"
  });
}