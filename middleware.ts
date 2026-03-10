import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Admin-only routes
    if (pathname.startsWith('/settings') && token?.role !== 'Admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/employees/:path*',
    '/departments/:path*',
    '/projects/:path*',
    '/tasks/:path*',
    '/finance/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/api/employees/:path*',
    '/api/departments/:path*',
    '/api/projects/:path*',
    '/api/tasks/:path*',
    '/api/expenses/:path*',
    '/api/dashboard/:path*',
  ],
};
