import { NextRequest, NextResponse } from 'next/server';

const PRIVATE_PREFIXES = ['/admin', '/login', '/admin-login', '/forgot-password', '/reset-password', '/install'];

function getBackendUrl(): string {
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/$/, '');
}

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Never run redirect resolution on private, API, or asset paths
  if (
    isPrivatePath(pathname) ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/sanctum') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/storage') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/opengraph-image' ||
    pathname.includes('.')
  ) {
    const response = NextResponse.next();
    if (isPrivatePath(pathname)) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return response;
  }

  try {
    const backend = getBackendUrl();
    const resolveUrl = `${backend}/api/v1/public/redirects/resolve?path=${encodeURIComponent(pathname)}`;
    const res = await fetch(resolveUrl, {
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const json = await res.json();
      const data = json?.data;
      if (data?.matched && data?.target_path) {
        const target = data.target_path as string;
        const destination = target.startsWith('http')
          ? target
          : new URL(`${target.startsWith('/') ? target : `/${target}`}${search}`, request.url).toString();

        return NextResponse.redirect(destination, data.status_code === 302 ? 302 : 301);
      }
    }
  } catch {
    // Fail open — never block page delivery for SEO redirect lookup failures
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static Next internals we already skip above.
     * Keep matcher broad so private X-Robots-Tag headers still apply.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
