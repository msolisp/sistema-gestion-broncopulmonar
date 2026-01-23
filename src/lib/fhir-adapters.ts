/**
 * Adapters for Legacy Patient/User to New FHIR Models
 * 
 * This file provides helper functions to ease the transition from
 * Patient/User to Persona/Credencial/FichaClinica/UsuarioSistema
 * 
 * TODO: Remove this file once all code is migrated to new models
 */

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Get Persona with all relations by email
 */
export async function getPersonaByEmail(email: string) {
    return prisma.persona.findUnique({
        where: { email },
        include: {
            credencial: true,
            fichaClinica: true,
            usuarioSistema: true
        }
    });
}

/**
 * Get Persona with all relations by RUT
 */
export async function getPersonaByRut(rut: string) {
    return prisma.persona.findUnique({
        where: { rut },
        include: {
            credencial: true,
            fichaClinica: true,
            usuarioSistema: true
        }
    });
}

/**
 * Get Persona with all relations by ID
 */
export async function getPersonaById(id: string) {
    return prisma.persona.findUnique({
        where: { id },
        include: {
            credencial: true,
            fichaClinica: true,
            usuarioSistema: true
        }
    });
}

/**
 * Create a new Patient (Persona + Credencial + FichaClinica)
 */
export async function createPatient(data: {
    rut: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    email: string;
    password: string;
    telefono?: string;
    direccion?: string;
    comuna: string;
    region?: string;
    fechaNacimiento?: Date;
    sexo?: 'M' | 'F' | 'OTRO' | 'NO_ESPECIFICADO';
    prevision?: string;
    fechaDiagnostico?: Date;
    cota?: number;
    creadoPor: string;
}) {
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create Persona + Credencial + FichaClinica in transaction
    return prisma.$transaction(async (tx) => {
        // 1. Create Persona
        const persona = await tx.persona.create({
            data: {
                rut: data.rut,
                nombre: data.nombre,
                apellidoPaterno: data.apellidoPaterno,
                apellidoMaterno: data.apellidoMaterno,
                email: data.email,
                telefono: data.telefono,
                direccion: data.direccion,
                comuna: data.comuna,
                region: data.region,
                fechaNacimiento: data.fechaNacimiento,
                sexo: data.sexo,
                creadoPor: data.creadoPor
            }
        });

        // 2. Create Credencial
        await tx.credencial.create({
            data: {
                personaId: persona.id,
                passwordHash,
                tipoAcceso: 'PACIENTE'
            }
        });

        // 3. Create FichaClinica
        await tx.fichaClinica.create({
            data: {
                personaId: persona.id,
                numeroFicha: persona.id, // Use persona ID as ficha number for now
                prevision: data.prevision,
                fechaDiagnostico: data.fechaDiagnostico,
                cota: data.cota,
                creadoPor: data.creadoPor
            }
        });

        return persona;
    });
}

/**
 * Create a new Staff User (Persona + Credencial + UsuarioSistema)
 */
export async function createStaffUser(data: {
    rut: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    email: string;
    password: string;
    rol: 'KINESIOLOGO' | 'MEDICO' | 'ENFERMERA' | 'TECNICO_PARVULARIO' | 'ADMIN' | 'RECEPCIONISTA';
    registroProfesional?: string;
    direccion?: string;
    comuna?: string;
    region?: string;
    creadoPor: string;
}) {
    const passwordHash = await bcrypt.hash(data.password, 10);

    return prisma.$transaction(async (tx) => {
        // 1. Create Persona
        const persona = await tx.persona.create({
            data: {
                rut: data.rut,
                nombre: data.nombre,
                apellidoPaterno: data.apellidoPaterno,
                apellidoMaterno: data.apellidoMaterno,
                email: data.email,
                direccion: data.direccion,
                comuna: data.comuna,
                region: data.region,
                creadoPor: data.creadoPor
            }
        });

        // 2. Create Credencial
        await tx.credencial.create({
            data: {
                personaId: persona.id,
                passwordHash,
                tipoAcceso: 'STAFF',
                debeCambiarPassword: true // Force password change on first login
            }
        });

        // 3. Create UsuarioSistema
        await tx.usuarioSistema.create({
            data: {
                personaId: persona.id,
                rol: data.rol,
                registroProfesional: data.registroProfesional,
                creadoPor: data.creadoPor
            }
        });

        return persona;
    });
}

/**
 * Update patient data
 */
export async function updatePatient(personaId: string, data: {
    email?: string;
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    telefono?: string;
    direccion?: string;
    comuna?: string;
    region?: string;
    fechaNacimiento?: Date;
    sexo?: 'M' | 'F' | 'OTRO' | 'NO_ESPECIFICADO';
    prevision?: string;
    fechaDiagnostico?: Date;
    cota?: number;
    password?: string;
    modificadoPor: string;
}) {
    return prisma.$transaction(async (tx) => {
        // Update Persona
        await tx.persona.update({
            where: { id: personaId },
            data: {
                email: data.email,
                nombre: data.nombre,
                apellidoPaterno: data.apellidoPaterno,
                apellidoMaterno: data.apellidoMaterno,
                telefono: data.telefono,
                direccion: data.direccion,
                comuna: data.comuna,
                region: data.region,
                fechaNacimiento: data.fechaNacimiento,
                sexo: data.sexo,
                modificadoPor: data.modificadoPor
            }
        });

        // Update FichaClinica if medical data changed
        if (data.prevision !== undefined || data.fechaDiagnostico !== undefined || data.cota !== undefined) {
            await tx.fichaClinica.update({
                where: { personaId },
                data: {
                    prevision: data.prevision,
                    fechaDiagnostico: data.fechaDiagnostico,
                    cota: data.cota,
                    modificadoPor: data.modificadoPor
                }
            });
        }

        // Update password if provided
        if (data.password) {
            const passwordHash = await bcrypt.hash(data.password, 10);
            await tx.credencial.update({
                where: { personaId },
                data: { passwordHash }
            });
        }
    });
}

/**
 * Check if RUT or Email already exists (for uniqueness validation)
 */
export async function checkPersonaExists(rut?: string, email?: string, excludePersonaId?: string) {
    const conditions: any[] = [];

    if (rut) conditions.push({ rut });
    if (email) conditions.push({ email });

    if (conditions.length === 0) return null;

    const query: any = {
        where: {
            OR: conditions
        }
    };

    if (excludePersonaId) {
        query.where.id = { not: excludePersonaId };
    }

    return prisma.persona.findFirst(query);
}
