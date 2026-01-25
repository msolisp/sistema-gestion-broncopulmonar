
import { LoginSchema, RegisterPatientSchema, BookAppointmentSchema } from './schemas';

describe('Schemas', () => {
    describe('LoginSchema', () => {
        it('accepts valid email/password', () => {
            const data = { email: 'test@test.com', password: 'password' };
            const result = LoginSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('rejects invalid email', () => {
            const data = { email: 'invalid', password: 'password' };
            const result = LoginSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    describe('RegisterPatientSchema', () => {
        it('validates password complexity', () => {
            const base = {
                name: 'Test', email: 't@t.com', rut: '11.111.111-1', commune: 'Santiago'
            };

            // Too short
            expect(RegisterPatientSchema.safeParse({ ...base, password: '123' }).success).toBe(false);

            // No uppercase
            expect(RegisterPatientSchema.safeParse({ ...base, password: 'password1!' }).success).toBe(false); // regex for lower present, need Upper

            // No special char
            expect(RegisterPatientSchema.safeParse({ ...base, password: 'Password1' }).success).toBe(false);

            // Valid password
            // Debug failure by checking result
            const res = RegisterPatientSchema.safeParse({ ...base, password: 'Password1!' });
            if (!res.success) {
                console.log(res.error.issues);
            }
            expect(res.success).toBe(true);
        });
    });

    describe('BookAppointmentSchema', () => {
        it('rejects past dates', () => {
            const past = new Date();
            past.setFullYear(2000);

            expect(BookAppointmentSchema.safeParse({ date: past.toISOString() }).success).toBe(false);
        });

        it('accepts future dates', () => {
            const future = new Date();
            future.setFullYear(2050);

            expect(BookAppointmentSchema.safeParse({ date: future.toISOString() }).success).toBe(true);
        });
    });
});
