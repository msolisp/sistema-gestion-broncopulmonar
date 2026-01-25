
import { cn, parseFullName } from './utils';

describe('Utils', () => {
    describe('cn', () => {
        it('merges classes', () => {
            expect(cn('c1', 'c2')).toBe('c1 c2');
        });

        it('handles conditionals', () => {
            expect(cn('c1', false && 'c2', 'c3')).toBe('c1 c3');
        });

        it('merges tailwind classes', () => {
            expect(cn('p-4', 'p-2')).toBe('p-2'); // twMerge should win
        });
    });

    describe('parseFullName', () => {
        it('parses simple 2-part name', () => {
            const res = parseFullName('Juan Perez');
            expect(res).toEqual({
                nombre: 'Juan',
                apellidoPaterno: 'Perez',
                apellidoMaterno: undefined
            });
        });

        it('parses 3-part name', () => {
            const res = parseFullName('Juan Perez Gonzalez');
            expect(res).toEqual({
                nombre: 'Juan',
                apellidoPaterno: 'Perez',
                apellidoMaterno: 'Gonzalez'
            });
        });

        it('parses 4-part name', () => {
            const res = parseFullName('Juan Andres Perez Gonzalez');
            expect(res).toEqual({
                nombre: 'Juan Andres',
                apellidoPaterno: 'Perez',
                apellidoMaterno: 'Gonzalez'
            });
        });

        it('parses single name', () => {
            const res = parseFullName('Juan');
            expect(res).toEqual({
                nombre: 'Juan',
                apellidoPaterno: 'SIN_APELLIDO',
                apellidoMaterno: undefined
            });
        });

        it('trims whitespace', () => {
            const res = parseFullName('  Juan    Perez  ');
            expect(res).toEqual({
                nombre: 'Juan',
                apellidoPaterno: 'Perez',
                apellidoMaterno: undefined
            });
        });
    });
});
