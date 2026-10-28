import type { NextConfig } from 'next';

const backendUrl = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');

const nextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  compress: true,
  /**
   * Same-origin proxy for Laravel Sanctum.
   * Browser talks only to the Next host, so XSRF-TOKEN is readable
   * and CSRF login works across local ports.
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/sanctum/:path*',
        destination: `${backendUrl}/sanctum/:path*`,
      },
      {
        source: '/storage/:path*',
        destination: `${backendUrl}/storage/:path*`,
      },
    ];
  },
  async headers() {
    const securityHeaders = [
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      {
        key: 'Content-Security-Policy',
        value:
          "default-src 'self' http: https:; img-src 'self' data: blob: http: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data: https:; connect-src 'self' http: https: ws: wss:;",
      },
    ];

    const noindexHeader = {
      key: 'X-Robots-Tag',
      value: 'noindex, nofollow',
    };

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/admin/:path*',
        headers: [noindexHeader],
      },
      {
        source: '/admin-login',
        headers: [noindexHeader],
      },
      {
        source: '/login',
        headers: [noindexHeader],
      },
      {
        source: '/forgot-password',
        headers: [noindexHeader],
      },
      {
        source: '/reset-password',
        headers: [noindexHeader],
      },
      {
        source: '/install/:path*',
        headers: [noindexHeader],
      },
      {
        source: '/install',
        headers: [noindexHeader],
      },
    ];
  },
} as NextConfig;

export default nextConfig;
