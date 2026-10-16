import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de seguridad para el control de acceso basado en sesiones y roles.
 * Protege las rutas del espacio de trabajo y restringe accesos no autorizados.
 */
export function middleware(request: NextRequest) {
    const sessionToken = request.cookies.get('sb_session')?.value;
    const userRole = request.cookies.get('user_role')?.value;
    const { pathname } = request.nextUrl;

    // Redireccionar al inicio de sesion si no existe una sesion activa
    if (!sessionToken && (pathname.startsWith('/workspace') || pathname.startsWith('/admin'))) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Restringir rutas administrativas a usuarios sin privilegios
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/workspace', request.url));
    }

    // Redireccionar al espacio de trabajo si el usuario ya esta autenticado
    if (sessionToken && pathname === '/') {
        return NextResponse.redirect(new URL('/workspace', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/workspace/:path*', '/admin/:path*', '/'],
};