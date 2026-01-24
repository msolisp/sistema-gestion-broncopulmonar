
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    session: {
        maxAge: 8 * 60 * 60, // 8 hours (more reasonable for production)
        updateAge: 15 * 60, // Update session every 15 minutes if active
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnInternal = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/intranet');

            // Password Change Enforcement
            if (isLoggedIn && (auth.user as any).mustChangePassword) {
                if (nextUrl.pathname !== '/change-password') {
                    return Response.redirect(new URL('/change-password', nextUrl));
                }
                return true;
            }

            if (nextUrl.pathname === '/change-password') {
                if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl));
                return true;
            }

            if (isOnInternal) {
                if (isLoggedIn) {
                    if (auth.user.role === 'PACIENTE') return Response.redirect(new URL('/portal', nextUrl));
                    return true;
                }
                // Prevent infinite redirect loop
                if (nextUrl.pathname === '/intranet/login') return true;

                return Response.redirect(new URL('/intranet/login', nextUrl));
            }

            const isOnPortal = nextUrl.pathname.startsWith('/portal');
            if (isOnPortal) {
                if (isLoggedIn) {
                    // Non-patients go to /patients (not /dashboard)
                    if (auth.user.role !== 'PACIENTE') {
                        // Admin goes to dashboard, others to patients
                        const defaultRoute = auth.user.role === 'ADMIN' ? '/dashboard' : '/patients';
                        return Response.redirect(new URL(defaultRoute, nextUrl));
                    }
                    return true;
                }
                return Response.redirect(new URL('/login', nextUrl)); // Redirect to public login
            }
            return true;
        },
        jwt({ token, user }) {
            if (user) {
                token.role = user.role
                token.id = user.id
                token.mustChangePassword = (user as any).mustChangePassword
                token.usuarioSistemaId = (user as any).usuarioSistemaId
            }
            return token
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string
                session.user.id = token.id as string
                (session.user as any).mustChangePassword = token.mustChangePassword as boolean
                (session.user as any).usuarioSistemaId = token.usuarioSistemaId as string
            }
            return session
        }
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig
