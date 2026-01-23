export type UserRole = 'ADMIN' | 'KINESIOLOGIST' | 'RECEPTIONIST' | 'PATIENT';

export interface SystemUser {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    active: boolean;
    rut?: string | null;
    region?: string | null;
    commune?: string | null;
    address?: string | null;
}
