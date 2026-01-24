import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

import { UserRole } from '@/components/admin/users/types';

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

    // Check if PACIENTE trying to access internal routes
    if (userRole === 'PACIENTE') {
        redirect(config.redirectTo || '/portal');
    }

    // Check role-based access if specified
    if (config.allowedRoles && !config.allowedRoles.includes(userRole)) {
        redirect(config.redirectTo || '/dashboard');
    }

    // Check permission-based access if specified
    if (config.requiredPermission) {
        // Granular permissions using PermisoUsuario to be implemented.
        // For now, only ADMIN has full access.
        if ((userRole as any) !== 'ADMIN') {
            redirect(config.redirectTo || '/dashboard');
        }
    }

    return { session, userRole, hasAccess: true };
}
