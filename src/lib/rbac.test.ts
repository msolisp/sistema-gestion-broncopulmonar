
import { hasPermission, isAdmin, Permission } from './rbac';

describe('RBAC Utils', () => {
    describe('hasPermission', () => {
        const permissions: Permission[] = [
            { recurso: 'users', accion: 'create', activo: true },
            { recurso: 'users', accion: 'delete', activo: false },
        ];

        it('returns true if permission exists and is active', () => {
            expect(hasPermission(permissions, 'users', 'create')).toBe(true);
        });

        it('returns false if permission exists but is inactive', () => {
            expect(hasPermission(permissions, 'users', 'delete')).toBe(false);
        });

        it('returns false if permission does not exist', () => {
            expect(hasPermission(permissions, 'users', 'update')).toBe(false);
        });

        it('returns false if permissions array is undefined or null', () => {
            expect(hasPermission(undefined, 'users', 'create')).toBe(false);
            // @ts-ignore
            expect(hasPermission(null, 'users', 'create')).toBe(false);
        });

        it('returns false if permissions is not an array', () => {
            // @ts-ignore
            expect(hasPermission({}, 'users', 'create')).toBe(false);
        });
    });

    describe('isAdmin', () => {
        it('returns true for ADMIN role', () => {
            expect(isAdmin('ADMIN')).toBe(true);
        });

        it('returns false for other roles', () => {
            expect(isAdmin('USER')).toBe(false);
            expect(isAdmin('KINESIOLOGIST')).toBe(false);
        });
    });
});
