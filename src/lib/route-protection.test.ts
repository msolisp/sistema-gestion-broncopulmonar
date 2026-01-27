// Mock dependencies BEFORE imports
jest.mock('@/auth', () => ({
    auth: jest.fn()
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn()
}));

jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        permisoRol: {
            findFirst: jest.fn()
        },
        permisoUsuario: {
            findUnique: jest.fn()
        },
        usuarioSistema: {
            findFirst: jest.fn()
        }
    }
}));

// Now import after mocks are set up
import { protectRoute } from './route-protection';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('protectRoute', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Authentication checks', () => {
        it('should redirect to /login if user is not authenticated', async () => {
            mockAuth.mockResolvedValue(null);
            mockRedirect.mockImplementation((url: string) => {
                throw new Error(`REDIRECT:${url}`);
            });

            await expect(protectRoute()).rejects.toThrow('REDIRECT:/login');
            expect(mockRedirect).toHaveBeenCalledWith('/login');
        });

        it('should redirect to /login if user email is missing', async () => {
            mockAuth.mockResolvedValue({
                user: { email: null }
            } as any);
            mockRedirect.mockImplementation((url: string) => {
                throw new Error(`REDIRECT:${url}`);
            });

            await expect(protectRoute()).rejects.toThrow('REDIRECT:/login');
            expect(mockRedirect).toHaveBeenCalledWith('/login');
        });
    });

    describe('ADMIN role checks', () => {
        it('should allow ADMIN to access any route without permission checks', async () => {
            mockAuth.mockResolvedValue({
                user: { email: 'admin@example.com', role: 'ADMIN' }
            } as any);

            const result = await protectRoute({
                requiredPermission: 'Any Permission',
                allowedRoles: ['KINESIOLOGIST']
            });

            expect(result.hasAccess).toBe(true);
            expect(result.userRole).toBe('ADMIN');
            expect(mockRedirect).not.toHaveBeenCalled();
            expect(mockPrisma.permisoRol.findFirst).not.toHaveBeenCalled();
            expect(mockPrisma.permisoUsuario.findUnique).not.toHaveBeenCalled();
        });
    });

    describe('PATIENT role checks', () => {
        it('should redirect PATIENT to /portal when accessing internal routes', async () => {
            mockAuth.mockResolvedValue({
                user: { email: 'patient@test.com', role: 'PACIENTE' }
            } as any);
            mockRedirect.mockImplementation((url: string) => {
                throw new Error(`REDIRECT:${url}`);
            });

            await expect(protectRoute()).rejects.toThrow('REDIRECT:/portal');
            expect(mockRedirect).toHaveBeenCalledWith('/portal');
        });

        it('should use custom redirectTo for PATIENT', async () => {
            mockAuth.mockResolvedValue({
                user: { email: 'patient@test.com', role: 'PACIENTE' }
            } as any);
            mockRedirect.mockImplementation((url: string) => {
                throw new Error(`REDIRECT:${url}`);
            });

            await expect(
                protectRoute({ redirectTo: '/custom-page' })
            ).rejects.toThrow('REDIRECT:/custom-page');
            expect(mockRedirect).toHaveBeenCalledWith('/custom-page');
        });
    });

    describe('Role-based access checks', () => {
        it('should allow access if user role is in allowedRoles', async () => {
            mockAuth.mockResolvedValue({
                user: { email: 'kine@example.com', role: 'KINESIOLOGIST' }
            } as any);

            const result = await protectRoute({
                allowedRoles: ['KINESIOLOGIST', 'RECEPTIONIST']
            });

            expect(result.hasAccess).toBe(true);
            expect(result.userRole).toBe('KINESIOLOGIST');
            expect(mockRedirect).not.toHaveBeenCalled();
        });

        it('should redirect if user role is NOT in allowedRoles', async () => {
            mockAuth.mockResolvedValue({
                user: { email: 'recep@example.com', role: 'RECEPTIONIST' }
            } as any);
            mockRedirect.mockImplementation((url: string) => {
                throw new Error(`REDIRECT:${url}`);
            });

            await expect(
                protectRoute({ allowedRoles: ['KINESIOLOGIST'] })
            ).rejects.toThrow('REDIRECT:/dashboard');
        });

        it('should use custom redirectTo when role check fails', async () => {
            mockAuth.mockResolvedValue({
                user: { email: 'recep@example.com', role: 'RECEPTIONIST' }
            } as any);
            mockRedirect.mockImplementation((url: string) => {
                throw new Error(`REDIRECT:${url}`);
            });

            await expect(
                protectRoute({
                    allowedRoles: ['KINESIOLOGIST'],
                    redirectTo: '/access-denied'
                })
            ).rejects.toThrow('REDIRECT:/access-denied');
        });
    });

    describe('Permission-based access checks', () => {
        it('should allow non-admin user if they have permission', async () => {
            mockAuth.mockResolvedValue({
                user: { email: 'kine@example.com', role: 'KINESIOLOGIST' }
            } as any);
            mockPrisma.usuarioSistema.findFirst.mockResolvedValue({ id: 'u1' } as any);
            mockPrisma.permisoUsuario.findUnique.mockResolvedValue({ activo: true } as any);

            const result = await protectRoute({ requiredPermission: 'Ver Pacientes' });

            expect(result.hasAccess).toBe(true);
            expect(mockRedirect).not.toHaveBeenCalled();
        });

        it('should redirect if user does NOT have required permission', async () => {
            mockAuth.mockResolvedValue({
                user: { email: 'recep@example.com', role: 'RECEPTIONIST' }
            } as any);
            mockPrisma.usuarioSistema.findFirst.mockResolvedValue({ id: 'u1' } as any);
            mockPrisma.permisoUsuario.findUnique.mockResolvedValue(null); // No explicit perm
            mockPrisma.permisoRol.findFirst.mockResolvedValue(null); // No role perm
            mockRedirect.mockImplementation((url: string) => {
                throw new Error(`REDIRECT:${url}`);
            });

            await expect(
                protectRoute({ requiredPermission: 'Ver Reportes BI' })
            ).rejects.toThrow('REDIRECT:/dashboard');
        });

        it('should use custom redirectTo when permission check fails', async () => {
            mockAuth.mockResolvedValue({
                user: { email: 'recep@example.com', role: 'RECEPTIONIST' }
            } as any);
            mockPrisma.usuarioSistema.findFirst.mockResolvedValue({ id: 'u1' } as any);
            mockPrisma.permisoUsuario.findUnique.mockResolvedValue(null);
            mockPrisma.permisoRol.findFirst.mockResolvedValue(null);
            mockRedirect.mockImplementation((url: string) => {
                throw new Error(`REDIRECT:${url}`);
            });

            await expect(
                protectRoute({
                    requiredPermission: 'Ver Reportes BI',
                    redirectTo: '/unauthorized'
                })
            ).rejects.toThrow('REDIRECT:/unauthorized');
        });

        it('should redirect if permissions array is empty', async () => {
            mockAuth.mockResolvedValue({
                user: { email: 'user@example.com', role: 'KINESIOLOGIST' }
            } as any);
            mockPrisma.usuarioSistema.findFirst.mockResolvedValue({ id: 'u1' } as any);
            mockPrisma.permisoUsuario.findUnique.mockResolvedValue(null);
            mockPrisma.permisoRol.findFirst.mockResolvedValue(null);
            mockRedirect.mockImplementation((url: string) => {
                throw new Error(`REDIRECT:${url}`);
            });

            await expect(
                protectRoute({ requiredPermission: 'Any Permission' })
            ).rejects.toThrow('REDIRECT:/dashboard');
        });
    });

    describe('Combined role and permission checks', () => {
        it('should check both role and permission when both are specified', async () => {
            mockAuth.mockResolvedValue({
                user: { email: 'kine@example.com', role: 'KINESIOLOGIST' }
            } as any);
            mockPrisma.usuarioSistema.findFirst.mockResolvedValue({ id: 'u1' } as any);
            // Even if user has permission, the current implementation might restrict strict role access if not implemented fully?
            // Actually, allowedRoles check logic is: if valid role, proceed. Then check permission.
            // If permission check fails, redirect.

            // To pass check, we need permission
            mockPrisma.permisoUsuario.findUnique.mockResolvedValue({ activo: true } as any);

            const result = await protectRoute({
                allowedRoles: ['KINESIOLOGIST', 'ADMIN'],
                requiredPermission: 'Ver Pacientes'
            });

            expect(result.hasAccess).toBe(true);
            expect(mockRedirect).not.toHaveBeenCalled();
        });

        it('should fail if role is allowed but permission is missing', async () => {
            mockAuth.mockResolvedValue({
                user: { email: 'kine@example.com', role: 'KINESIOLOGIST' }
            } as any);
            mockPrisma.usuarioSistema.findFirst.mockResolvedValue({ id: 'u1' } as any);
            mockPrisma.permisoUsuario.findUnique.mockResolvedValue(null);
            mockPrisma.permisoRol.findFirst.mockResolvedValue(null);
            mockRedirect.mockImplementation((url: string) => {
                throw new Error(`REDIRECT:${url}`);
            });

            await expect(
                protectRoute({
                    allowedRoles: ['KINESIOLOGIST'],
                    requiredPermission: 'Ver Reportes BI'
                })
            ).rejects.toThrow('REDIRECT:/dashboard');
        });
    });

    describe('Return values', () => {
        it('should return session, userRole, and hasAccess on success', async () => {
            const mockSession = {
                user: { email: 'admin@example.com', role: 'ADMIN' }
            };
            mockAuth.mockResolvedValue(mockSession as any);

            const result = await protectRoute();

            expect(result).toEqual({
                session: mockSession,
                userRole: 'ADMIN',
                hasAccess: true
            });
        });
    });
});
