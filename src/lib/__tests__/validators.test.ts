import {
    validarRutChileno,
    formatearRut,
    limpiarRut,
    obtenerCuerpoRut,
    obtenerDigitoVerificador,
    esRutPersonaNatural
} from '../validators';

describe('RUT Validators', () => {
    describe('limpiarRut', () => {
        it('should remove dots and dashes', () => {
            expect(limpiarRut('12.345.678-9')).toBe('123456789');
            expect(limpiarRut('12345678-9')).toBe('123456789');
            expect(limpiarRut('123456789')).toBe('123456789');
        });

        it('should handle RUT with K', () => {
            expect(limpiarRut('12.345.678-K')).toBe('12345678K');
            expect(limpiarRut('12.345.678-k')).toBe('12345678K');
        });

        it('should trim whitespace', () => {
            expect(limpiarRut('  12.345.678-9  ')).toBe('123456789');
        });
    });

    describe('formatearRut', () => {
        it('should format RUT with dots and dash', () => {
            expect(formatearRut('123456789')).toBe('12.345.678-9');
            expect(formatearRut('12345678K')).toBe('12.345.678-K');
        });

        it('should handle already formatted RUT', () => {
            expect(formatearRut('12.345.678-9')).toBe('12.345.678-9');
        });

        it('should handle short RUT', () => {
            expect(formatearRut('10000009')).toBe('1.000.000-9');
        });
    });

    describe('validarRutChileno', () => {
        it('should validate correct RUTs', () => {
            // RUTs reales válidos
            expect(validarRutChileno('11.111.111-1')).toBe(true);
            expect(validarRutChileno('22.222.222-2')).toBe(true);
            expect(validarRutChileno('12.345.678-5')).toBe(true);
            expect(validarRutChileno('1.000.000-9')).toBe(true);
            expect(validarRutChileno('1.000.005-K')).toBe(true);
        });

        it('should validate RUT without format', () => {
            expect(validarRutChileno('111111111')).toBe(true);
            expect(validarRutChileno('123456785')).toBe(true);
        });

        it('should validate RUT with K', () => {
            expect(validarRutChileno('1.000.005-K')).toBe(true);
            expect(validarRutChileno('1.000.005-k')).toBe(true); // lowercase
            expect(validarRutChileno('1000005K')).toBe(true);
        });

        it('should reject invalid RUTs', () => {
            expect(validarRutChileno('11.111.111-2')).toBe(false); // wrong DV
            expect(validarRutChileno('12.345.678-9')).toBe(false); // wrong DV
            expect(validarRutChileno('7.654.321-5')).toBe(false); // wrong DV (should be K)
        });

        it('should reject malformed RUTs', () => {
            expect(validarRutChileno('')).toBe(false);
            expect(validarRutChileno('abc')).toBe(false);
            expect(validarRutChileno('12345')).toBe(false); // too short
            expect(validarRutChileno('1234567X9')).toBe(false); // invalid chars
        });

        it('should handle edge cases', () => {
            // @ts-expect-error - testing null
            expect(validarRutChileno(null)).toBe(false);
            // @ts-expect-error - testing undefined
            expect(validarRutChileno(undefined)).toBe(false);
            // @ts-expect-error - testing number
            expect(validarRutChileno(12345678)).toBe(false);
        });
    });

    describe('obtenerCuerpoRut', () => {
        it('should extract RUT body', () => {
            expect(obtenerCuerpoRut('12.345.678-9')).toBe('12345678');
            expect(obtenerCuerpoRut('1.000.000-9')).toBe('1000000');
        });
    });

    describe('obtenerDigitoVerificador', () => {
        it('should extract verification digit', () => {
            expect(obtenerDigitoVerificador('12.345.678-9')).toBe('9');
            expect(obtenerDigitoVerificador('24.992.516-K')).toBe('K');
        });
    });

    describe('esRutPersonaNatural', () => {
        it('should identify natural person RUT', () => {
            expect(esRutPersonaNatural('12.345.678-5')).toBe(true);
            expect(esRutPersonaNatural('1.000.005-K')).toBe(true);
        });

        it('should reject company RUT', () => {
            // Las empresas tienen RUT >= 50.000.000
            expect(esRutPersonaNatural('76.123.456-7')).toBe(false);
            expect(esRutPersonaNatural('96.800.570-7')).toBe(false);
        });

        it('should return false for invalid RUT', () => {
            expect(esRutPersonaNatural('11.111.111-2')).toBe(false);
        });
    });
});
