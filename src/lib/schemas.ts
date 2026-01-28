import { z } from 'zod';
import { validarRutChileno } from '@/lib/validators';

// Regex for Names: Letters, spaces, apostrophes, hyphens. No numbers or special symbols.
const NAME_REGEX = /^[a-zA-Z\u00C0-\u00FF\s'-]+$/;
const NAME_ERROR = 'El nombre solo puede contener letras, espacios, apóstrofes o guiones.';

export const LoginSchema = z.object({
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(1, { message: 'La contraseña es requerida' }),
});

export const RegisterPatientSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).regex(NAME_REGEX, { message: NAME_ERROR }),
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string()
        .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
        .regex(/[A-Z]/, { message: 'Debe contener al menos una mayúscula' })
        .regex(/[a-z]/, { message: 'Debe contener al menos una minúscula' })
        //.regex(/[0-9]/, { message: 'Debe contener al menos un número' })
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { message: 'Debe contener al menos un carácter especial' }),
    rut: z.string().refine(validarRutChileno, { message: 'RUT inválido. Debe incluir dígito verificador.' }),
    commune: z.string().min(1, { message: 'Debes seleccionar una comuna de residencia' }),
    phone: z.string().optional(),
    birthDate: z.string().optional().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        const now = new Date();
        return !isNaN(date.getTime()) && date <= now;
    }, { message: 'Fecha de nacimiento inválida o futura' }),
});

export const BookAppointmentSchema = z.object({
    date: z.string().refine((val) => {
        const date = new Date(val);
        const now = new Date();
        return !isNaN(date.getTime()) && date >= now;
    }, { message: 'La fecha debe ser válida y futura' }),
    notes: z.string().optional(),
});

export const UpdatePatientProfileSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).regex(NAME_REGEX, { message: NAME_ERROR }),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    commune: z.string().optional().or(z.literal('')),
    region: z.string().optional().or(z.literal('')),
    gender: z.string().optional().or(z.literal('')),
    healthSystem: z.string().optional().or(z.literal('')),
    cota: z.string().optional().or(z.literal('')).transform((val) => {
        if (!val || val === '') return undefined;
        const num = parseFloat(val);
        if (isNaN(num)) return undefined;
        // Round to 1 decimal place
        return parseFloat(num.toFixed(1));
    }),
    rut: z.string().optional().or(z.literal('')).refine((val) => !val || validarRutChileno(val), { message: 'RUT inválido' }),
    birthDate: z.string().optional().or(z.literal('')).refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        const now = new Date();
        return !isNaN(date.getTime()) && date <= now;
    }, { message: 'Fecha de nacimiento inválida o futura' }),
});

export const AdminCreatePatientSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).regex(NAME_REGEX, { message: NAME_ERROR }),
    email: z.string().email({ message: 'Email inválido' }),
    rut: z.string().refine(validarRutChileno, { message: 'RUT inválido' }),
    region: z.string().min(1, { message: 'Debes seleccionar una región' }),
    commune: z.string().min(1, { message: 'Debes seleccionar una comuna' }),
    address: z.string().optional(),
    gender: z.string().optional(),
    healthSystem: z.string().optional(),
    birthDate: z.string().optional().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        const now = new Date();
        return !isNaN(Date.parse(val)) && date <= now;
    }, { message: 'Fecha de nacimiento inválida o futura' }),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }).optional().or(z.literal('')),
});

export const AdminUpdatePatientSchema = z.object({
    id: z.string().min(1, { message: 'ID de paciente requerido' }),
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).regex(NAME_REGEX, { message: NAME_ERROR }),
    email: z.string().email({ message: 'Email inválido' }),
    rut: z.string().refine(validarRutChileno, { message: 'RUT inválido' }),
    region: z.string().min(1, { message: 'Debes seleccionar una región' }).optional(),
    commune: z.string().optional(),
    address: z.string().optional(),
    gender: z.string().optional(),
    healthSystem: z.string().optional(),
    birthDate: z.string().optional().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        const now = new Date();
        return !isNaN(Date.parse(val)) && date <= now;
    }, { message: 'Fecha de nacimiento inválida o futura' }),
    diagnosisDate: z.string().optional().refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        const now = new Date();
        return !isNaN(Date.parse(val)) && date <= now;
    }, { message: 'Fecha de diagnóstico inválida o futura' }),
    active: z.boolean(),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }).optional().or(z.literal('')),
});

export const DeletePatientSchema = z.object({
    id: z.string().min(1, { message: 'ID de paciente requerido' }),
});

export const AdminCreateSystemUserSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).regex(NAME_REGEX, { message: NAME_ERROR }),
    email: z.string().email({ message: 'Email inválido' }),
    password: z.string()
        .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
        .regex(/[A-Z]/, { message: 'Debe contener al menos una mayúscula' })
        .regex(/[a-z]/, { message: 'Debe contener al menos una minúscula' })
        //.regex(/[0-9]/, { message: 'Debe contener al menos un número' })
        .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { message: 'Debe contener al menos un carácter especial' }),
    role: z.string().min(1, { message: 'El rol es requerido' }),
    active: z.boolean().optional(),
    rut: z.string().refine(validarRutChileno, { message: 'RUT inválido' }),
    region: z.string().optional(),
    commune: z.string().optional(),
    address: z.string().optional(),
});

export const AdminUpdateSystemUserSchema = z.object({
    id: z.string().min(1, { message: 'ID de usuario requerido' }),
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }).regex(NAME_REGEX, { message: NAME_ERROR }),
    email: z.string().email({ message: 'Email inválido' }),
    role: z.string().min(1, { message: 'El rol es requerido' }),
    active: z.boolean(),
    rut: z.string().refine(val => !val || validarRutChileno(val), { message: 'RUT inválido' }).optional().nullable().or(z.literal('')),
    region: z.string().optional().nullable(),
    commune: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }).optional().or(z.literal('')),
});
