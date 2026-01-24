export type UserRole = string;

export interface SystemUser {
    id: string;
    name: string;
    email: string;
    role: string;
    roleName: string;
    active: boolean;
    rut?: string | null;
    region?: string | null;
    commune?: string | null;
    address?: string | null;
}
