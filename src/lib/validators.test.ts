
import {
    limpiarRut, formatearRut, validarRutChileno,
    obtenerCuerpoRut, obtenerDigitoVerificador, esRutPersonaNatural,
    validarRutSeparado
} from './validators';

describe('Validators', () => {

    describe('RUT Utils', () => {
        it('limpiarRut removes format', () => {
            expect(limpiarRut('12.345.678-5')).toBe('123456785');
            expect(limpiarRut('  12.345.678-k  ')).toBe('12345678K');
        });

        it('formatearRut adds format', () => {
            expect(formatearRut('123456785')).toBe('12.345.678-5');
            expect(formatearRut('11111111')).toBe('1.111.111-1'); // Legitimate length RUT (1.111.111-1)
        });

        it('validarRutChileno validates strictly', () => {
            // Valid RUT (11.111.111-1 is valid)
            expect(validarRutChileno('11.111.111-1')).toBe(true);

            // Invalid
            expect(validarRutChileno('11.111.111-2')).toBe(false);
            expect(validarRutChileno('invalid')).toBe(false);
            expect(validarRutChileno('')).toBe(false);
        });

        it('esRutPersonaNatural filters companies', () => {
            // RUT < 50m
            // 30.686.957-4 is valid.
            expect(esRutPersonaNatural('30.686.957-4')).toBe(true);

            // RUT > 50m (Company)
            // 76.123.123-? need valid DV
            // 76123123 -> ... let's just assume validRutChileno passes provided we use a valid one.
            // But checking the number is easy.
            // 50.000.000-K (VALID? 5*3=15. 11-4=7? No.)
            // Let's rely on logic: if validarRutChileno returns true, then check number.
            // But to test this I need a valid > 50m RUT.
            // 60.803.000-K (Common test?)
            // Let's use 50.000.000 range.
            // 52.222.222-?
            // Body 52222222.
            // 2*2=4, 2*3=6, 2*4=8, 2*5=10, 2*6=12, 2*7=14, 2*2=4, 5*3=15.
            // Sum = 4+6+8+10+12+14+4+15 = 73.
            // 73%11 = 7. 11-7=4.
            // 52.222.222-4 is valid.
            expect(esRutPersonaNatural('52.222.222-4')).toBe(false);

            expect(esRutPersonaNatural('invalid')).toBe(false);
        });

        it('validarRutSeparado combines parts', () => {
            // 11.111.111-1
            expect(validarRutSeparado('11111111', '1')).toBe(true);
            expect(validarRutSeparado('11111111', '2')).toBe(false);
        });
    });
});
