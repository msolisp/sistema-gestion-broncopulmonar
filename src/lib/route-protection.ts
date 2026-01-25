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
        // Map UI string to DB Resource/Action
        const UI_TO_DB: Record<string, { recurso: string, accion: string }> = {
            'Ver Agendamiento': { recurso: 'Agendamiento', accion: 'Ver' },
            'Ver Pacientes': { recurso: 'Pacientes', accion: 'Ver' },
            'Ver Reportes BI': { recurso: 'Reportes BI', accion: 'Ver' },
            'Ver Asistente': { recurso: 'Asistente Clínico', accion: 'Ver' },
            'Ver HL7': { recurso: 'Estándar HL7', accion: 'Ver' },
            'Ver Exámenes Cargados': { recurso: 'Notificaciones', accion: 'Ver' },
            'Ver Usuarios': { recurso: 'Seguridad (RBAC)', accion: 'Ver' },
            'Configuración Global': { recurso: 'Configuración Global', accion: 'Ver' }
        };

        const target = UI_TO_DB[config.requiredPermission];

        if (target) {
            // Find user record
            const user = await prisma.usuarioSistema.findFirst({
                where: {
                    persona: { email: session.user.email },
                    activo: true
                }
            });

            if (!user) redirect('/login');

            // Check if user has explicit permission
            const userPerm = await prisma.permisoUsuario.findUnique({
                where: {
                    usuarioId_recurso_accion: {
                        usuarioId: user.id,
                        recurso: target.recurso,
                        accion: target.accion
                    }
                }
            });

            // Fallback: If no explicit user permission, check role permissions
            if (!userPerm || !userPerm.activo) {
                const rolePerm = await prisma.permisoRol.findFirst({
                    where: {
                        rol: { nombre: userRole },
                        recurso: target.recurso,
                        accion: target.accion,
                        activo: true
                    }
                });

                if (!rolePerm) {
                    redirect(config.redirectTo || '/dashboard');
                }
            }
        } else {
            // Fallback for unknown permission strings
            if ((userRole as any) !== 'ADMIN') {
                redirect(config.redirectTo || '/dashboard');
            }
        }
    }

    return { session, userRole, hasAccess: true };
}
