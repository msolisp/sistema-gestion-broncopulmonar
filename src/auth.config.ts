
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnInternal = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/intranet');
            const isOnPublic = !isOnInternal;

            if (isOnInternal) {
                if (isLoggedIn) {
                    if (auth.user.role === 'PATIENT') return Response.redirect(new URL('/portal', nextUrl));
                    return true;
                }
                // Prevent infinite redirect loop
                if (nextUrl.pathname === '/intranet/login') return true;

                return Response.redirect(new URL('/intranet/login', nextUrl));
            }

            const isOnPortal = nextUrl.pathname.startsWith('/portal');
            if (isOnPortal) {
                if (isLoggedIn) {
                    if (auth.user.role !== 'PATIENT') return Response.redirect(new URL('/dashboard', nextUrl));
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
            }
            return token
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string
                session.user.id = token.id as string
            }
            return session
        }
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig
