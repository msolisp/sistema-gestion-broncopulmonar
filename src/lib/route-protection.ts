import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export type UserRole = 'ADMIN' | 'KINESIOLOGIST' | 'RECEPTIONIST' | 'PATIENT';

interface ProtectionConfig {
    requiredPermission?: string;
    allowedRoles?: UserRole[];
    redirectTo?: string;
}

/**
 * Protects a route by checking user authentication and permissions
 * Server-side protection that cannot be bypassed
 * @throws Redirects to appropriate page if access denied
 */
export async function protectRoute(config: ProtectionConfig = {}) {
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.email) {
        redirect('/login');
    }

    const userRole = (session.user as any).role as UserRole;

    // ADMIN always has access (super user)
    if (userRole === 'ADMIN') {
        return { session, userRole, hasAccess: true };
    }

    // Check if PATIENT trying to access internal routes
    if (userRole === 'PATIENT') {
        redirect(config.redirectTo || '/portal');
    }

    // Check role-based access if specified
    if (config.allowedRoles && !config.allowedRoles.includes(userRole)) {
        redirect(config.redirectTo || '/dashboard');
    }

    // Check permission-based access if specified
    if (config.requiredPermission) {
        const permissions = await prisma.rolePermission.findMany({
            where: {
                role: userRole,
                enabled: true
            },
            select: { action: true }
        });

        const hasPermission = permissions.some((p: { action: string }) => p.action === config.requiredPermission);

        if (!hasPermission) {
            redirect(config.redirectTo || '/dashboard');
        }
    }

    return { session, userRole, hasAccess: true };
}
