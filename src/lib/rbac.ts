// Permission check utility for RBAC

export type UserRole = 'ADMIN' | 'KINESIOLOGO' | 'RECEPCIONISTA' | 'MEDICO' | 'ENFERMERA' | 'TECNICO_PARVULARIO' | 'PACIENTE';

export interface Permission {
    recurso: string;
    accion: string;
    activo: boolean;
}

export function hasPermission(
    userPermissions: Permission[] | undefined,
    resource: string,
    action: string
): boolean {
    // Fail safe
    if (!userPermissions || !Array.isArray(userPermissions)) return false;

    // Check for specific permission
    const permission = userPermissions.find(
        p => p.recurso === resource && p.accion === action
    );

    return permission?.activo ?? false;
}

// Helper to check if user IS admin (bypass for now, but good to have)
export function isAdmin(role: string): boolean {
    return role === 'ADMIN';
}
