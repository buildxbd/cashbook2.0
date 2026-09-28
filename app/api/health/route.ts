import { NextResponse } from 'next/server';
import { isLiveUPIEnabled, getPaymentEngineMode } from '@/lib/config/features';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    runtime: 'edge',
    platform: 'Cloudflare Pages',
    featureFlags: {
      liveUPI: isLiveUPIEnabled(),
      paymentEngine: getPaymentEngineMode(),
    },
    timestamp: new Date().toISOString(),
  });
}
