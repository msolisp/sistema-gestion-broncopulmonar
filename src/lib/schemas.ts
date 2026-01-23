import { z } from 'zod';

export const LoginSchema = z.object({
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(1, { message: 'La contraseña es requerida' }),
});

export const RegisterPatientSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string()
        .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
        .regex(/[A-Z]/, { message: 'Debe contener al menos una mayúscula' })
        .regex(/[a-z]/, { message: 'Debe contener al menos una minúscula' })
        //.regex(/[0-9]/, { message: 'Debe contener al menos un número' })
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { message: 'Debe contener al menos un carácter especial' }),
    rut: z.string().min(8, { message: 'RUT inválido' }), // Basic length check, ideally regex
    commune: z.string().min(1, { message: 'Debes seleccionar una comuna de residencia' }),
});

export const BookAppointmentSchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha inválida' }),
    notes: z.string().optional(),
});

export const UpdatePatientProfileSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    commune: z.string().optional().or(z.literal('')),
    gender: z.string().optional().or(z.literal('')),
    healthSystem: z.string().optional().or(z.literal('')),
    cota: z.string().optional().or(z.literal('')).transform((val) => {
        if (!val || val === '') return undefined;
        const num = parseFloat(val);
        if (isNaN(num)) return undefined;
        // Round to 1 decimal place
        return parseFloat(num.toFixed(1));
    }),
    rut: z.string().optional().or(z.literal('')),
    birthDate: z.string().optional().or(z.literal('')).refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
    }, { message: 'Fecha de nacimiento inválida' }),
});

export const AdminCreatePatientSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    email: z.string().email({ message: 'Email inválido' }),
    rut: z.string().min(8, { message: 'RUT inválido' }),
    region: z.string().min(1, { message: 'Debes seleccionar una región' }),
    commune: z.string().min(1, { message: 'Debes seleccionar una comuna' }),
    address: z.string().optional(),
    gender: z.string().optional(),
    healthSystem: z.string().optional(),
    birthDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Fecha de nacimiento inválida' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }).optional().or(z.literal('')),
});

export const AdminUpdatePatientSchema = z.object({
    id: z.string().min(1, { message: 'ID de paciente requerido' }),
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    email: z.string().email({ message: 'Email inválido' }),
    rut: z.string().min(8, { message: 'RUT inválido' }),
    region: z.string().min(1, { message: 'Debes seleccionar una región' }).optional(),
    commune: z.string().optional(),
    address: z.string().optional(),
    gender: z.string().optional(),
    healthSystem: z.string().optional(),
    birthDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Fecha de nacimiento inválida' }),
    diagnosisDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Fecha de diagnóstico inválida' }),
    active: z.boolean(),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }).optional().or(z.literal('')),
});

export const DeletePatientSchema = z.object({
    id: z.string().min(1, { message: 'ID de paciente requerido' }),
});

export const AdminCreateSystemUserSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string()
        .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
        .regex(/[A-Z]/, { message: 'Debe contener al menos una mayúscula' })
        .regex(/[a-z]/, { message: 'Debe contener al menos una minúscula' })
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { message: 'Debe contener al menos un carácter especial' }),
    role: z.enum(['ADMIN', 'KINESIOLOGIST', 'RECEPTIONIST']),
    active: z.boolean().optional(),
    rut: z.string().optional(),
    region: z.string().optional(),
    commune: z.string().optional(),
    address: z.string().optional(),
});

export const AdminUpdateSystemUserSchema = z.object({
    id: z.string().min(1, { message: 'ID de usuario requerido' }),
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    email: z.string().email({ message: 'Email inválido' }),
    role: z.enum(['ADMIN', 'KINESIOLOGIST', 'RECEPTIONIST']),
    active: z.boolean(),
    rut: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    commune: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
});
