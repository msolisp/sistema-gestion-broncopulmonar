'use server'

import prisma from '@/lib/prisma';
import { RegisterPatientSchema, UpdatePatientProfileSchema, AdminCreatePatientSchema, AdminUpdatePatientSchema, DeletePatientSchema } from './schemas';
import { createPatient, updatePatient, checkPersonaExists, getPersonaByRut } from '@/lib/fhir-adapters';
import { validarRutChileno } from '@/lib/validators';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import { logAction } from './logger';

export async function registerPatient(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData);

    const { parseFullName } = await import('./utils');

    // Combine RUT
    const rutBody = formData.get('rutBody') as string;
    const rutDv = formData.get('rutDv') as string;

    if (rutBody && rutDv) {
        // Simple formatting
        const cleanBody = rutBody.replace(/\D/g, '');
        const formattedBody = cleanBody.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        rawData.rut = `${formattedBody}-${rutDv.toUpperCase()}`;
    }

    const validation = RegisterPatientSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { email, password, name, rut, commune } = validation.data;

    // Validate RUT format
    if (!validarRutChileno(rut)) {
        return { message: 'RUT inválido. Verifica el formato y dígito verificador.' };
    }

    // Check if patient exists using FHIR adapter
    const existingPersona = await checkPersonaExists(rut, email);
    if (existingPersona) {
        if (existingPersona.email === email) {
            return { message: 'El email ya está registrado' };
        }
        if (existingPersona.rut === rut) {
            return { message: 'El RUT ya está registrado' };
        }
    }

    // Parse name using helper
    const { nombre, apellidoPaterno, apellidoMaterno } = parseFullName(name);

    try {
        // Use FHIR adapter to create patient
        await createPatient({
            rut,
            nombre: nombre || name,
            apellidoPaterno: apellidoPaterno || 'SIN_APELLIDO',
            apellidoMaterno,
            email,
            password,
            comuna: commune,
            creadoPor: 'SELF_REGISTRATION'
        });
    } catch (e) {
        console.error(e)
        return { message: 'Database Error: Failed to Create Patient' };
    }

    return { message: 'Success' };
}

export async function updatePatientProfile(prevState: any, formData: FormData) {
    const session = await auth();

    if (!session?.user?.email) {
        return { message: 'Unauthorized' };
    }

    const rawData = Object.fromEntries(formData);
    const validation = UpdatePatientProfileSchema.safeParse(rawData);

    if (!validation.success) {
        console.error("Profile Update Validation Error:", validation.error.format());
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { name, phone, address, commune, region, gender, healthSystem, cota, rut, birthDate } = validation.data;

    // Parse name using helper
    const { parseFullName } = await import('./utils');
    const { nombre, apellidoPaterno, apellidoMaterno } = parseFullName(name);

    // Parse sexo from gender
    let sexo: 'M' | 'F' | 'OTRO' | 'NO_ESPECIFICADO' | undefined;
    if (gender === 'M' || gender === 'Masculino') sexo = 'M';
    else if (gender === 'F' || gender === 'Femenino') sexo = 'F';
    else if (gender === 'OTRO' || gender === 'Otro') sexo = 'OTRO';
    else if (gender) sexo = 'OTRO';


    try {
        if (!session.user?.id) return { message: 'Session error: No user ID' };
        // Use FHIR adapter
        const payload = {
            nombre: nombre || name,
            apellidoPaterno: apellidoPaterno || 'SIN_APELLIDO',
            apellidoMaterno,
            telefono: phone,
            direccion: address,
            comuna: commune,
            region: region,
            rut: rut,
            fechaNacimiento: birthDate ? new Date(birthDate) : undefined,
            sexo,
            prevision: healthSystem,
            cota: cota !== undefined ? parseFloat(cota as any) : undefined,
            modificadoPor: session.user.email || 'SELF'
        };
        const result = await updatePatient(session.user.id, payload);

        revalidatePath('/portal', 'layout');
        revalidatePath('/portal/perfil');
        revalidatePath('/', 'layout');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Failed to update profile' };
    }
}

export async function adminCreatePatient(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    const userRole = (session.user as any).role;
    if (!['ADMIN', 'KINESIOLOGO', 'RECEPCIONISTA'].includes(userRole)) {
        return { message: 'Unauthorized: Access denied' };
    }

    const rawData = Object.fromEntries(formData);
    const validation = AdminCreatePatientSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { name, email, rut, commune, region, address, gender, healthSystem, birthDate, password } = validation.data;

    if (!password) {
        return { message: 'La contraseña es obligatoria para nuevos usuarios.' };
    }

    // Validate RUT format
    if (!validarRutChileno(rut)) {
        return { message: 'RUT inválido. Verifica el formato y dígito verificador.' };
    }

    // Check RUT uniqueness
    const personaWithRut = await checkPersonaExists(rut);
    if (personaWithRut) {
        return { message: 'El RUT ya está registrado en el sistema' };
    }

    // Check email uniqueness
    const personaWithEmail = await checkPersonaExists(undefined, email);
    if (personaWithEmail) {
        return { message: 'El email ya está registrado en el sistema' };
    }

    // Parse name using helper
    const { parseFullName } = await import('./utils');
    const { nombre, apellidoPaterno, apellidoMaterno } = parseFullName(name);

    // Parse sexo from gender
    let sexo: 'M' | 'F' | 'OTRO' | 'NO_ESPECIFICADO' | undefined;
    if (gender === 'Masculino') sexo = 'M';
    else if (gender === 'Femenino') sexo = 'F';
    else if (gender === 'Otro') sexo = 'OTRO';
    else if (gender === 'M') sexo = 'M';
    else if (gender === 'F') sexo = 'F';
    else if (gender) sexo = 'OTRO';

    try {
        // Use FHIR adapter to create patient
        await createPatient({
            rut,
            nombre: nombre || name,
            apellidoPaterno: apellidoPaterno || 'SIN_APELLIDO',
            apellidoMaterno,
            email,
            password,
            comuna: commune,
            region,
            direccion: address,
            fechaNacimiento: birthDate ? new Date(birthDate) : undefined,
            sexo,
            prevision: healthSystem,
            creadoPor: session.user.email || 'ADMIN'
        });

        // Add Audit Log
        const { headers } = await import('next/headers');
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || "Unknown IP";

        // Find operator ID
        const userStaff = await prisma.usuarioSistema.findFirst({ where: { persona: { email: session.user.email as string } } });
        if (userStaff) {
            await prisma.logAccesoSistema.create({
                data: {
                    accion: 'CREATE_PATIENT',
                    accionDetalle: `Patient created: ${email}`,
                    usuarioId: userStaff.id,
                    recurso: 'PERSONA',
                    recursoId: 'NEW',
                    ipAddress: ip
                }
            });
        }

        // revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error al crear paciente' };
    }
}

export async function adminUpdatePatient(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    const userRole = (session.user as any).role;
    if (!['ADMIN', 'KINESIOLOGO', 'RECEPCIONISTA'].includes(userRole)) {
        return { message: 'Unauthorized: Access denied' };
    }

    const rawData = {
        ...Object.fromEntries(formData),
        active: formData.get('active') === 'on'
    };
    const validation = AdminUpdatePatientSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { id, name, email, rut, commune, region, address, gender, healthSystem, birthDate, diagnosisDate, active, password } = validation.data;

    // Validate RUT format
    if (!validarRutChileno(rut)) {
        return { message: 'RUT inválido. Verifica el formato y dígito verificador.' };
    }

    try {
        // Find Persona by RUT (new schema)
        const persona = await prisma.persona.findUnique({
            where: { rut }
        });

        if (!persona) {
            return { message: 'Paciente no encontrado' };
        }

        // Check if email is taken by another persona
        const duplicateEmail = await prisma.persona.findFirst({
            where: {
                email,
                NOT: { id: persona.id }
            }
        });

        if (duplicateEmail) {
            return { message: 'El email ya está en uso por otro paciente.' };
        }

        // Parse name using helper
        const { parseFullName } = await import('./utils');
        const { nombre, apellidoPaterno, apellidoMaterno } = parseFullName(name);

        // Parse gender
        let sexo: 'M' | 'F' | 'OTRO' | 'NO_ESPECIFICADO' | undefined;
        if (gender === 'Masculino') sexo = 'M';
        else if (gender === 'Femenino') sexo = 'F';
        else if (gender === 'Otro') sexo = 'OTRO';
        else if (gender) sexo = 'OTRO'; // Default any other value to OTRO

        // Calculate Diff
        const changes: Record<string, { old: any, new: any }> = {};
        const oldName = `${persona.nombre} ${persona.apellidoPaterno} ${persona.apellidoMaterno || ''}`.trim();
        if (oldName !== name.trim()) changes['Nombre'] = { old: oldName, new: name.trim() };
        if (persona.email !== email) changes['Email'] = { old: persona.email, new: email };
        if (persona.rut !== rut) changes['RUT'] = { old: persona.rut, new: rut };
        if (persona.comuna !== commune) changes['Comuna'] = { old: persona.comuna, new: commune };
        if (persona.region !== region) changes['Región'] = { old: persona.region, new: region };
        if (persona.activo !== active) changes['Estado'] = { old: persona.activo ? 'Activo' : 'Inactivo', new: active ? 'Activo' : 'Inactivo' };

        // Use FHIR adapter to update patient
        await updatePatient(persona.id, {
            email,
            nombre: nombre || name,
            apellidoPaterno: apellidoPaterno || 'SIN_APELLIDO',
            apellidoMaterno,
            comuna: commune,
            region,
            direccion: address,
            fechaNacimiento: birthDate ? new Date(birthDate) : undefined,
            sexo,
            prevision: healthSystem,
            fechaDiagnostico: diagnosisDate ? new Date(diagnosisDate) : undefined,
            password: password && password.trim().length >= 6 ? password : undefined,
            modificadoPor: session.user.email || 'ADMIN'
        });

        await logAction(
            'PATIENT_UPDATED',
            JSON.stringify(changes),
            null,
            session.user.email
        );

        revalidatePath('/dashboard');
        revalidatePath('/patients');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: `Error al actualizar: ${(e as Error).message}` };
    }
}

export async function deletePatient(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    const userRole = (session.user as any).role;
    if (!['ADMIN', 'KINESIOLOGO', 'RECEPCIONISTA'].includes(userRole)) {
        return { message: 'Unauthorized: Access denied' };
    }

    const rawData = Object.fromEntries(formData);
    const validation = DeletePatientSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos' };
    }

    const { id } = validation.data;

    // Find corresponding Persona via FichaClinica
    const fichaClinica = await prisma.fichaClinica.findUnique({
        where: { personaId: id }
    });

    if (!fichaClinica) {
        return { message: 'Ficha clínica no encontrada para el nuevo sistema' };
    }

    try {
        // Soft delete: mark as inactive
        await prisma.persona.update({
            where: { id: fichaClinica.personaId },
            data: {
                activo: false,
                eliminadoEn: new Date(),
                eliminadoPor: session.user.email || 'ADMIN'
            }
        });

        await prisma.fichaClinica.update({
            where: { id: fichaClinica.id },
            data: {
                activo: false,
                eliminadoEn: new Date(),
                eliminadoPor: session.user.email || 'ADMIN',
                motivoEliminacion: 'Eliminado por administrador'
            }
        });

        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error al eliminar paciente' };
    }
}

export async function uploadMedicalExam(formData: FormData) {
    const session = await auth();

    // Check if user is logged in
    if (!session?.user) return { message: 'Unauthorized' };

    const patientId = formData.get('patientId') as string;
    const centerName = formData.get('centerName') as string;
    const doctorName = formData.get('doctorName') as string;
    const examDate = formData.get('examDate') as string;
    const file = formData.get('file') as File;

    if (!file || !patientId || !centerName || !doctorName || !examDate) {
        return { message: 'Faltan campos obligatorios' };
    }

    // 5MB Limit Check
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
        return { message: 'El archivo excede el límite de 5MB' };
    }

    // RBAC & IDOR Check
    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'KINESIOLOGO') {
        const persona = await prisma.persona.findUnique({
            where: { email: session.user.email as string },
        });

        if (!persona || persona.id !== patientId) {
            return { message: 'No autorizado para subir exámenes a este perfil.' };
        }
    }

    if (file.size === 0) return { message: 'El archivo está vacío' };
    // 1. Check declared MIME type (Fail fast)
    if (file.type !== 'application/pdf') return { message: 'Solo se permiten archivos PDF' };

    // 2. Check Magic Bytes (Secure check)
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // file-type is ESM, so we import dynamically
        const { fileTypeFromBuffer } = await import('file-type');
        const type = await fileTypeFromBuffer(buffer);

        if (!type || type.mime !== 'application/pdf') {
            return { message: 'El archivo no es un PDF válido (Firma digital incorrecta).' };
        }

        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const fileName = `${timestamp}-${safeName}`;

        let fileUrl = '';

        // Bypass Vercel Blob in Development/Test if no token
        if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && !process.env.BLOB_READ_WRITE_TOKEN) {
            console.warn('Using Mock Upload (No BLOB_READ_WRITE_TOKEN provided)');
            // Use localhost API route instead of mock-storage.local for iframe compatibility
            fileUrl = `/api/mock-storage/${fileName}`;
        } else {
            // Upload to Vercel Blob
            const blob = await put(fileName, file, {
                access: 'public',
            });
            fileUrl = blob.url;
        }

        // Find FichaClinica
        const ficha = await prisma.fichaClinica.findUnique({
            where: { personaId: patientId }
        });

        if (!ficha) {
            return { message: 'Ficha clínica no encontrada para este paciente.' };
        }

        const origen = userRole === 'PACIENTE' ? 'PORTAL_PACIENTES' : 'PORTAL_INTERNO';

        const examMedico = await prisma.examenMedico.create({
            data: {
                fichaClinicaId: ficha.id,
                fechaExamen: new Date(examDate),
                nombreCentro: centerName,
                nombreDoctor: doctorName,
                archivoUrl: fileUrl,
                archivoNombre: file.name,
                revisado: false,
                origen: origen,
                subidoPor: session.user.email
            }
        });

        // Audit Log - Only for system users (internal portal)
        let auditUserId = (session.user as any).usuarioSistemaId;
        if (!auditUserId && userRole !== 'PACIENTE') {
            const operator = await prisma.usuarioSistema.findFirst({
                where: { personaId: session.user.id }
            });
            auditUserId = operator?.id;
        }

        if (auditUserId) {
            await prisma.logAccesoSistema.create({
                data: {
                    accion: 'UPLOAD_EXAM',
                    accionDetalle: `Patient: ${patientId}, File: ${file.name}, Origin: ${origen}`,
                    usuarioId: auditUserId,
                    recurso: 'EXAMEN_MEDICO',
                    recursoId: 'NEW',
                    ipAddress: '::1'
                }
            });
        }

        // Create notification for staff if uploaded by patient
        if (origen === 'PORTAL_PACIENTES') {
            try {
                const patient = await prisma.persona.findUnique({ where: { id: patientId } });
                await prisma.notification.create({
                    data: {
                        patientId: patientId,
                        type: 'EXAM_UPLOADED',
                        title: 'Nuevo examen subido',
                        message: `${patient?.nombre || 'Paciente'} ${patient?.apellidoPaterno || ''} subió un examen médico de ${centerName}`,
                        examId: examMedico.id,
                        read: false,
                    }
                });
            } catch (notifErr) {
                console.error('Error creating notification in uploadMedicalExam:', notifErr);
            }
        }

        revalidatePath(`/patients/${patientId}/history`);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { message: 'Error al subir examen' };
    }
}

export async function reviewMedicalExam(examId: string) {
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'KINESIOLOGO') {
        return { message: 'Unauthorized' };
    }

    try {
        await prisma.examenMedico.update({
            where: { id: examId },
            data: { revisado: true }
        });
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error marking exam as reviewed' };
    }
}
