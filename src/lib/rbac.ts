// Permission check utility for RBAC
export function hasPermission(
    userRole: string,
    action: string,
    permissions: Array<{ role: string; action: string; enabled: boolean }>
): boolean {
    // Admin always has all permissions
    if (userRole === 'ADMIN') return true;

    const permission = permissions.find(
        p => p.role === userRole && p.action === action
    );

    return permission?.enabled ?? false;
}

export type UserRole = 'ADMIN' | 'KINESIOLOGIST' | 'RECEPTIONIST' | 'PATIENT';

export interface RolePermission {
    role: string;
    action: string;
    enabled: boolean;
}
