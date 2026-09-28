import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/security/rate-limiter';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate Limiting on API endpoints
  if (pathname.startsWith('/api/')) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '127.0.0.1';

    // 120 requests per minute per IP
    const rateResult = checkRateLimit(ip, 120, 60000);

    if (!rateResult.success) {
      const retryAfter = Math.max(1, Math.ceil((rateResult.reset - Date.now()) / 1000));
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(rateResult.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateResult.reset),
          },
        }
      );
    }
  }

  const response = NextResponse.next();

  // Production Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons (PWA icon files)
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json).*)',
  ],
};
