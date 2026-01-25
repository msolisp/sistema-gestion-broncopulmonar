
import { authConfig } from './auth.config';
import { NextAuthConfig } from 'next-auth';


// Mock Response.redirect since it's not available in Jest environment
if (!Response.redirect) {
    // @ts-ignore
    Response.redirect = function (url: string | URL, status: number = 302) {
        return new Response(null, {
            status,
            headers: { Location: url.toString() }
        });
    };
}

describe('authConfig', () => {
    describe('authorized callback', () => {
        const authorized = authConfig.callbacks?.authorized;

        if (!authorized) {
            throw new Error('Authorized callback is not defined');
        }

        const createMockRequest = (pathname: string) => {
            const url = new URL(pathname, 'http://localhost:3000');
            return {
                nextUrl: url
            };
        };

        it('redirects to /login if accessing /change-password while not logged in', async () => {
            const result = await authorized({
                auth: null,
                request: createMockRequest('/change-password'),
            } as any);

            expect(result).toBeInstanceOf(Response);
            // @ts-ignore
            expect(result.headers.get('location')).toContain('/login');
        });

        it('allows access to /change-password if logged in', async () => {
            const result = await authorized({
                auth: { user: { id: '1' } },
                request: createMockRequest('/change-password'),
            } as any);
            expect(result).toBe(true);
        });

        it('redirects to /change-password if user must change password and is not already there', async () => {
            const result = await authorized({
                auth: { user: { id: '1', mustChangePassword: true } },
                request: createMockRequest('/dashboard'),
            } as any);

            expect(result).toBeInstanceOf(Response);
            // @ts-ignore
            expect(result.headers.get('location')).toContain('/change-password');
        });

        it('allows access if user must change password and is visiting /change-password', async () => {
            const result = await authorized({
                auth: { user: { id: '1', mustChangePassword: true } },
                request: createMockRequest('/change-password'),
            } as any);
            expect(result).toBe(true);
        });


        // Internal Routes (/dashboard, /intranet)
        describe('Internal Routes', () => {
            it('redirects PACIENTE from /dashboard to /portal', async () => {
                const result = await authorized({
                    auth: { user: { role: 'PACIENTE' } },
                    request: createMockRequest('/dashboard'),
                } as any);
                expect(result).toBeInstanceOf(Response);
                // @ts-ignore
                expect(result.headers.get('location')).toContain('/portal');
            });

            it('allows non-PACIENTE users to access /dashboard', async () => {
                const result = await authorized({
                    auth: { user: { role: 'ADMIN' } },
                    request: createMockRequest('/dashboard'),
                } as any);
                expect(result).toBe(true);
            });

            it('redirects unauthenticated users from /dashboard to /intranet/login', async () => {
                const result = await authorized({
                    auth: null,
                    request: createMockRequest('/dashboard'),
                } as any);
                expect(result).toBeInstanceOf(Response);
                // @ts-ignore
                expect(result.headers.get('location')).toContain('/intranet/login');
            });

            it('allows unauthenticated users to access /intranet/login (loop prevention)', async () => {
                const result = await authorized({
                    auth: null,
                    request: createMockRequest('/intranet/login'),
                } as any);
                expect(result).toBe(true);
            });
        });

        // Portal Routes (/portal)
        describe('Portal Routes', () => {
            it('redirects unauthenticated users to /login', async () => {
                const result = await authorized({
                    auth: null,
                    request: createMockRequest('/portal'),
                } as any);
                expect(result).toBeInstanceOf(Response);
                // @ts-ignore
                expect(result.headers.get('location')).toContain('/login');
            });

            it('allows PACIENTE users to access /portal', async () => {
                const result = await authorized({
                    auth: { user: { role: 'PACIENTE' } },
                    request: createMockRequest('/portal'),
                } as any);
                expect(result).toBe(true);
            });

            it('redirects ADMIN from /portal to /dashboard', async () => {
                const result = await authorized({
                    auth: { user: { role: 'ADMIN' } },
                    request: createMockRequest('/portal'),
                } as any);
                expect(result).toBeInstanceOf(Response);
                // @ts-ignore
                expect(result.headers.get('location')).toContain('/dashboard');
            });

            it('redirects KINESIOLOGIST (non-admin, non-patient) from /portal to /patients', async () => {
                const result = await authorized({
                    auth: { user: { role: 'KINESIOLOGIST' } },
                    request: createMockRequest('/portal'),
                } as any);
                expect(result).toBeInstanceOf(Response);
                // @ts-ignore
                expect(result.headers.get('location')).toContain('/patients');
            });
        });

        it('allows access to public usage routes', async () => {
            const result = await authorized({
                auth: null,
                request: createMockRequest('/about'),
            } as any);
            expect(result).toBe(true);
        });
    });

    describe('jwt callback', () => {
        const jwt = authConfig.callbacks?.jwt;
        if (!jwt) throw new Error('JWT callback undefined');

        it('returns token as is if no user', async () => {
            const token = { sub: '123' };
            const result = await jwt({ token, user: null } as any);
            expect(result).toBe(token);
        });

        it('populates token with user fields', async () => {
            const token = { sub: '123' };
            const user = {
                id: 'user-1',
                role: 'ADMIN',
                mustChangePassword: true,
                usuarioSistemaId: 'sys-1'
            };
            const result = await jwt({ token, user } as any);
            expect(result).toMatchObject({
                sub: '123',
                role: 'ADMIN',
                id: 'user-1',
                mustChangePassword: true,
                usuarioSistemaId: 'sys-1'
            });
        });
    });

    describe('session callback', () => {
        const sessionCb = authConfig.callbacks?.session;
        if (!sessionCb) throw new Error('Session callback undefined');

        it('returns session as is if no token', async () => {
            const session = { user: { name: 'Test' } };
            const result = await sessionCb({ session, token: null } as any);
            expect(result).toBe(session);
        });

        it('populates session user from token', async () => {
            const session = { user: { name: 'Test' } };
            const token = {
                role: 'ADMIN',
                id: 'user-1',
                mustChangePassword: true,
                usuarioSistemaId: 'sys-1'
            };
            const result = await sessionCb({ session, token } as any);
            expect(result.user).toMatchObject({
                role: 'ADMIN',
                id: 'user-1',
                mustChangePassword: true,
                usuarioSistemaId: 'sys-1'
            });
        });
    });
});
