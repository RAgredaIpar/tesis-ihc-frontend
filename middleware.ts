import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const sessionToken = request.cookies.get('sb_session')?.value;
    const userRole = request.cookies.get('user_role')?.value;

    const { pathname } = request.nextUrl;

    // 🎯 CORREGIDO: Si no hay sesión, rebota a la raíz '/' (donde está tu login)
    if (!sessionToken && (pathname.startsWith('/workspace') || pathname.startsWith('/admin'))) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Si un Patólogo intenta meterse por URL a /admin
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/workspace', request.url));
    }

    // 🎯 CORREGIDO: Si ya está logueado e intenta ir al login ('/'), lo mandamos al workspace
    if (sessionToken && pathname === '/') {
        return NextResponse.redirect(new URL('/workspace', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // 🎯 CORREGIDO: Escuchamos la raíz '/' en lugar de '/login'
    matcher: ['/workspace/:path*', '/admin/:path*', '/'],
};