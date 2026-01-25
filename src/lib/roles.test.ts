
import { Role, ROLE_LABELS } from './roles';

describe('Roles Utils', () => {
    it('has all expected roles in enum', () => {
        expect(Role.ADMIN).toBe('ADMIN');
        expect(Role.KINESIOLOGO).toBe('KINESIOLOGO');
        expect(Role.PACIENTE).toBe('PACIENTE');
        expect(Role.MEDICO).toBe('MEDICO');
    });

    it('has labels for all roles', () => {
        Object.values(Role).forEach(role => {
            expect(ROLE_LABELS[role]).toBeDefined();
            expect(typeof ROLE_LABELS[role]).toBe('string');
        });
    });

    it('maps specific roles correctly', () => {
        expect(ROLE_LABELS[Role.ADMIN]).toBe('Administrador');
        expect(ROLE_LABELS[Role.PACIENTE]).toBe('Paciente');
    });
});
