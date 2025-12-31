
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
                if (isLoggedIn) return true;
                return Response.redirect(new URL('/intranet/login', nextUrl));
            }
            return true;
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
