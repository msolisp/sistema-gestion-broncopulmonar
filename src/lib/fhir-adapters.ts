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
    rol: string;
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
                debeCambiarPassword: false // Do not force password change on first login
            }
        });

        // 3. Create UsuarioSistema
        await tx.usuarioSistema.create({
            data: {
                personaId: persona.id,
                rolId: data.rol,
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
    rut?: string;
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
                rut: data.rut,
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

        return { success: true };
    });
}

/**
 * Update staff data
 */
export async function updateStaffUser(usuarioSistemaId: string, data: {
    rut?: string;
    email?: string;
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string | null;
    direccion?: string | null;
    comuna?: string | null;
    region?: string | null;
    rol?: string;
    active?: boolean;
    registroProfesional?: string;
    password?: string;
    modificadoPor: string;
}) {
    return prisma.$transaction(async (tx) => {
        // 1. Find UsuarioSistema to get personaId
        const staff = await tx.usuarioSistema.findUnique({
            where: { id: usuarioSistemaId },
            include: { persona: true }
        });

        if (!staff) throw new Error('Staff user not found');

        const personaId = staff.personaId;

        // 2. Update Persona
        await tx.persona.update({
            where: { id: personaId },
            data: {
                rut: data.rut,
                email: data.email,
                nombre: data.nombre,
                apellidoPaterno: data.apellidoPaterno,
                apellidoMaterno: data.apellidoMaterno,
                direccion: data.direccion,
                comuna: data.comuna,
                region: data.region,
                activo: data.active !== undefined ? data.active : undefined, // Global active
                modificadoPor: data.modificadoPor
            }
        });

        // 3. Update UsuarioSistema
        await tx.usuarioSistema.update({
            where: { id: usuarioSistemaId },
            data: {
                rolId: data.rol,
                activo: data.active !== undefined ? data.active : undefined, // Staff active
                registroProfesional: data.registroProfesional,
                modificadoPor: data.modificadoPor
            }
        });

        // 4. Update password if provided
        if (data.password) {
            const passwordHash = await bcrypt.hash(data.password, 10);
            await tx.credencial.update({
                where: { personaId },
                data: {
                    passwordHash,
                    debeCambiarPassword: false // Reset flag if changed by admin
                }
            });
        }

        return { success: true };
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

/**
 * Adapt Pulmonary Function Test to FHIR Observations
 * "Flattens" the single database row into multiple Observation resources.
 */
export function adaptPulmonaryToFHIRObservations(
    record: {
        id: string;
        fecha: Date;
        cvfValue?: number | null;
        cvfPercent?: number | null;
        vef1Value?: number | null;
        vef1Percent?: number | null;
        walkDistance?: number | null;
        spo2Rest?: number | null;
        personaId?: string; // Optional context
    }
) {
    const observations = [];
    const timestamp = record.fecha.toISOString();

    // Helper to create basic observation structure
    const createObservation = (code: string, display: string, value: number, unit: string) => ({
        resourceType: "Observation",
        status: "final",
        code: {
            coding: [
                {
                    system: "http://loinc.org",
                    code: code,
                    display: display
                }
            ]
        },
        subject: {
            reference: `Patient/${record.personaId || 'Unknown'}`
        },
        effectiveDateTime: timestamp,
        valueQuantity: {
            value: value,
            unit: unit,
            system: "http://unitsofmeasure.org",
            code: unit
        }
    });

    if (record.cvfValue) {
        observations.push(createObservation('19868-9', 'Forced vital capacity [Volume] Respiratory system by Spirometry', record.cvfValue, 'L'));
    }
    if (record.cvfPercent) {
        observations.push(createObservation('19870-5', 'Forced vital capacity [Volume] Respiratory system by Spirometry / Predicted', record.cvfPercent, '%'));
    }
    if (record.vef1Value) {
        observations.push(createObservation('20150-1', 'FEV1 [Volume]', record.vef1Value, 'L'));
    }
    if (record.walkDistance) {
        observations.push(createObservation('62816-5', '6 minute walk distance', record.walkDistance, 'm'));
    }
    if (record.spo2Rest) {
        observations.push(createObservation('20590-4', 'Oxygen saturation in Arterial blood', record.spo2Rest, '%'));
    }

    return {
        resourceType: "Bundle",
        type: "collection",
        entry: observations.map(obs => ({ resource: obs }))
    };
}
