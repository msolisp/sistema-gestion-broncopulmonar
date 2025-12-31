import { z } from 'zod';

export const LoginSchema = z.object({
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(1, { message: 'La contraseña es requerida' }),
});

export const RegisterPatientSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
    rut: z.string().min(8, { message: 'RUT inválido' }), // Basic length check, ideally regex
    commune: z.string().min(1, { message: 'Comuna requerida' }),
});

export const BookAppointmentSchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Fecha inválida' }),
    notes: z.string().optional(),
});

export const UpdatePatientProfileSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    phone: z.string().optional(),
    address: z.string().optional(),
    commune: z.string().optional(),
    gender: z.string().optional(),
    healthSystem: z.string().optional(),
    birthDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Fecha de nacimiento inválida' }),
});

export const AdminCreatePatientSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    email: z.string().email({ message: 'Email inválido' }),
    rut: z.string().min(8, { message: 'RUT inválido' }),
    commune: z.string().min(1, { message: 'Comuna requerida' }),
    address: z.string().optional(),
    gender: z.string().optional(),
    healthSystem: z.string().optional(),
    birthDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Fecha de nacimiento inválida' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }).optional().or(z.literal('')),
});

export const AdminUpdatePatientSchema = z.object({
    id: z.string().min(1, { message: 'ID de paciente requerido' }),
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    rut: z.string().min(8, { message: 'RUT inválido' }),
    commune: z.string().optional(),
    address: z.string().optional(),
    gender: z.string().optional(),
    healthSystem: z.string().optional(),
    birthDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Fecha de nacimiento inválida' }),
    diagnosisDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: 'Fecha de diagnóstico inválida' }),
});

export const DeletePatientSchema = z.object({
    id: z.string().min(1, { message: 'ID de paciente requerido' }),
});
