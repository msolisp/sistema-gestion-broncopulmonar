'use server'

import { signIn, signOut } from '@/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAction } from './logger';
import { loggers } from './structured-logger';
import { createPatient, createStaffUser, updatePatient, checkPersonaExists, getPersonaByEmail } from '@/lib/fhir-adapters';
import { validarRutChileno, limpiarRut } from '@/lib/validators';
import { put } from '@vercel/blob';
import {
    LoginSchema,
    RegisterPatientSchema,
    BookAppointmentSchema,
    UpdatePatientProfileSchema,
    AdminCreatePatientSchema,
    AdminUpdatePatientSchema,
    DeletePatientSchema,
    AdminCreateSystemUserSchema,
    AdminUpdateSystemUserSchema
} from './schemas';

export async function logout() {
    await signOut({ redirectTo: '/login' });
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    const rawData = Object.fromEntries(formData);
    const validation = LoginSchema.safeParse(rawData);

    if (!validation.success) {
        return 'Datos inválidos';
    }

    const { email } = validation.data;

    try {
        console.log('Attempting login for:', email);
        console.log('Environment E2E_TESTING:', process.env.E2E_TESTING);
        const portalType = formData.get('portal_type');
        console.log('DEBUG: Auth Attempt:', email);
        console.log('DEBUG: E2E_TESTING:', process.env.E2E_TESTING);
        console.log('DEBUG: Portal Type:', portalType);

        // 1. VISUAL CAPTCHA VALIDATION (First layer)
        const visualCaptchaValue = formData.get('visual-captcha-value') as string;
        const visualCaptchaToken = formData.get('visual-captcha-token') as string;

        // Skip CAPTCHA validation in E2E testing mode
        if (process.env.E2E_TESTING !== 'true' && visualCaptchaValue && visualCaptchaToken) {
            try {
                const { jwtVerify } = await import('jose');
                const secret = new TextEncoder().encode(
                    process.env.AUTH_SECRET || 'fallback-secret-key'
                );

                const { payload } = await jwtVerify(visualCaptchaToken, secret);
                const expectedText = (payload.text as string).toLowerCase();
                const userText = visualCaptchaValue.toLowerCase().trim();

                if (expectedText !== userText) {
                    return 'Código de seguridad incorrecto.';
                }
            } catch (error) {
                console.error('Visual CAPTCHA validation error:', error);
                return 'Código de seguridad expirado o inválido.';
            }
        }

        // 2. Turnstile Captcha Verification (Second layer)
        // Skip Turnstile validation in E2E testing mode
        const captchaToken = formData.get('cf-turnstile-response');
        if (process.env.E2E_TESTING !== 'true' && (process.env.NODE_ENV === 'production' || captchaToken)) {
            if (!captchaToken) {
                return 'Captcha inválido. Por favor intenta de nuevo.';
            }

            const secretKey = process.env.TURNSTILE_SECRET_KEY;
            if (!secretKey) {
                console.error('TURNSTILE_SECRET_KEY missing in server env');
                // Fail open or closed depending on security policy. Start with warning but allow if missing config to prevent lockout during setup.
                // But user requested Strict security.
                if (process.env.NODE_ENV === 'production') return 'Error interno de configuración de seguridad.';
            } else {
                const ip = (await (await import('next/headers')).headers()).get("x-forwarded-for") || "127.0.0.1";
                const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

                const formData = new URLSearchParams();
                formData.append('secret', secretKey);
                formData.append('response', captchaToken as string);
                formData.append('remoteip', ip);

                const result = await fetch(verifyUrl, {
                    body: formData,
                    method: 'POST',
                });
                const outcome = await result.json();
                if (!outcome.success) {
                    console.warn(`Turnstile validation failed for ${email}:`, outcome);
                    return 'Verificación de seguridad fallida.';
                }
            }
        }

        // Rate Limiting

        // Rate Limiting
        // Rate Limiting
        if (process.env.E2E_TESTING !== 'true') {
            const { rateLimit } = await import('@/lib/rate-limit');
            try {
                await rateLimit(email); // Limit by email
            } catch (e) {
                return 'Demasiados intentos. Por favor espera 1 minuto.';
            }
        }

        // Pre-check role to determine redirection
        // const portalType = formData.get('portal_type'); // Already got above for debug
        let role = '';
        let mustChangePassword = false;
        let active = true;

        if (portalType === 'internal') {
            const user = await prisma.user.findUnique({
                where: { email },
                select: { role: true, mustChangePassword: true, active: true }
            });
            if (!user) {
                // If not found in User table, check if exists as Persona (Staff)
                const persona = await prisma.persona.findUnique({
                    where: { email },
                    include: { usuarioSistema: true }
                });
                if (persona && persona.usuarioSistema) {
                    // Map generic roles if needed or usage direct role
                    const roleMap: Record<string, string> = {
                        'KINESIOLOGO': 'KINESIOLOGIST',
                        'MEDICO': 'DOCTOR',
                        'ADMIN': 'ADMIN',
                        'RECEPCIONISTA': 'RECEPTIONIST'
                    };
                    role = roleMap[persona.usuarioSistema.rol] || persona.usuarioSistema.rol;
                    active = persona.activo && persona.usuarioSistema.activo;
                } else {
                    // Check if it is a patient trying to access internal portal
                    const patientPersona = await prisma.persona.findUnique({ where: { email } });
                    if (patientPersona) {
                        return 'No tiene acceso al portal interno.';
                    }
                }
                // Otherwise let signIn handle invalid credentials
            } else {
                role = user.role;
                mustChangePassword = user.mustChangePassword;
                active = user.active;
            }
        } else {
            // Check Persona (Patient)
            const persona = await prisma.persona.findUnique({
                where: { email },
                select: { activo: true }
            });
            if (persona) {
                role = 'PATIENT';
                active = persona.activo;
            }
        }

        if (!active) return 'Cuenta inactiva.';

        let redirectTo = '/reservar'; // Default fallback

        // Security Check: Internal Portal Access
        if (portalType === 'internal') {
            if (role === 'PATIENT') {
                // Logic hole: Patient won't be found in User table, so role is empty. 
                // If a User has ROLE='PATIENT' (legacy), we block.
                // But new Patients are in Patient table. 
                // If someone tries to login with Patient credentials at Internal, 
                // Query `User` returns null. `signIn` returns null. Result: "Credenciales inválidas".
                // This is SAFE.
                // The explicit message "No tiene acceso" helps if a USER (Staff) tries to login but has restricted role?
                // Or if we want to give feedback to patient.
                // If we want to check if it IS a patient trying:
                // Logic hole: Patient won't be found in User table.
                const isPatient = await prisma.persona.findUnique({ where: { email } });
                // If found in Persona but NO UsuarioSistema, it is likely a patient
                const isStaff = await prisma.usuarioSistema.findFirst({ where: { persona: { email } } });
                if (isPatient && !isStaff) return 'No tiene acceso al portal interno.';
            }
        }

        if (mustChangePassword) {
            redirectTo = '/change-password';
        } else if (role === 'ADMIN') {
            redirectTo = '/dashboard';
        } else if (['KINESIOLOGIST', 'RECEPTIONIST'].includes(role)) {
            redirectTo = '/patients';
        } else {
            redirectTo = '/portal';
        }

        // Artificial Delay for Rate Limiting to prevent Brute Force
        // Artificial Delay for Rate Limiting to prevent Brute Force
        if (process.env.E2E_TESTING !== 'true') {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await signIn('credentials', {
            ...rawData,
            redirectTo
        });

        // Capture IP for Audit
        const { headers } = await import('next/headers');
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "Unknown IP";

        await logAction('LOGIN_SUCCESS', `User ${email} logged in`, null, email, ip);
        loggers.auth.loginSuccess(email, ip);

    } catch (error) {
        if ((error as any).message === 'NEXT_REDIRECT' || (error as any).digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }

        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales inválidas.';
                default:
                    return 'Algo salió mal.';
            }
        }
        const { headers } = await import('next/headers');
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || "Unknown IP";
        await logAction('LOGIN_FAILURE', `Failed login attempt for ${email}`, null, email, ip);
        loggers.auth.loginFailed(email, error instanceof AuthError ? error.type : 'Unknown', ip);
        loggers.error.api('/authenticate', error as Error, email);
        throw error;
    }
}

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

export async function bookAppointment(prevState: any, formData: FormData) {
    const { auth } = await import('@/auth');
    const sessionData = await auth();

    if (!sessionData?.user?.email) {
        return { message: 'Unauthorized, please log in.' }
    }

    const rawData = Object.fromEntries(formData);
    const validation = BookAppointmentSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { date, notes } = validation.data;
    const dateStr = date;

    // Find FichaClinica by user ID (session.user.id is now Persona.id)
    const fichaClinica = await prisma.fichaClinica.findUnique({
        where: { personaId: sessionData.user.id },
    });

    if (!fichaClinica) {
        return { message: `Ficha clínica no encontrada para el usuario: ${sessionData.user.email}` };
    }

    try {
        await prisma.cita.create({
            data: {
                fichaClinicaId: fichaClinica.id,
                fecha: new Date(dateStr),
                notas: notes,
                estado: 'PENDIENTE'
            }
        });
    } catch (e) {
        return { message: 'Error al agendar cita' };
    }

    return { message: 'Success' };
}

export async function updatePatientProfile(prevState: any, formData: FormData) {
    const { auth } = await import('@/auth');
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

    const { name, phone, address, commune, gender, healthSystem, cota, rut, birthDate } = validation.data;

    // Parse name using helper
    const { parseFullName } = await import('./utils');
    const { nombre, apellidoPaterno, apellidoMaterno } = parseFullName(name);

    // Parse sexo from gender
    let sexo: 'M' | 'F' | 'OTRO' | 'NO_ESPECIFICADO' | undefined;
    if (gender === 'M') sexo = 'M';
    else if (gender === 'F') sexo = 'F';
    else if (gender) sexo = 'OTRO';

    try {
        if (!session.user?.id) return { message: 'Session error: No user ID' };
        // Use FHIR adapter
        await updatePatient(session.user.id, {
            nombre: nombre || name,
            apellidoPaterno: apellidoPaterno || 'SIN_APELLIDO',
            apellidoMaterno,
            telefono: phone,
            direccion: address,
            comuna: commune,
            fechaNacimiento: birthDate ? new Date(birthDate) : undefined,
            sexo,
            prevision: healthSystem,
            cota: cota !== undefined ? parseFloat(cota as any) : undefined,
            modificadoPor: session.user.email || 'SELF'
        });

        revalidatePath('/portal', 'layout');
        revalidatePath('/portal/perfil');
        revalidatePath('/', 'layout');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Failed to update profile' };
    }
}

// Admin Actions for Patient Management

export async function adminCreatePatient(prevState: any, formData: FormData) {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    const userRole = (session.user as any).role;
    if (!['ADMIN', 'KINESIOLOGIST', 'RECEPTIONIST'].includes(userRole)) {
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

    // Check RUT uniqueness separately
    const personaWithRut = await prisma.persona.findUnique({
        where: { rut }
    });
    if (personaWithRut) {
        return { message: 'El RUT ya está registrado en el sistema' };
    }

    // Check email uniqueness separately
    const personaWithEmail = await prisma.persona.findFirst({
        where: { email }
    });
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
        await logAction('CREATE_PATIENT', `Patient created: ${email}`, (session.user as any).id, session.user.email, ip);

        // revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error al crear paciente' };
    }
}

export async function adminUpdatePatient(prevState: any, formData: FormData) {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    const userRole = (session.user as any).role;
    if (!['ADMIN', 'KINESIOLOGIST', 'RECEPTIONIST'].includes(userRole)) {
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

        revalidatePath('/dashboard');
        revalidatePath('/patients');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: `Error al actualizar: ${(e as Error).message}` };
    }
}

export async function deletePatient(prevState: any, formData: FormData) {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    const userRole = (session.user as any).role;
    if (!['ADMIN', 'KINESIOLOGIST', 'RECEPTIONIST'].includes(userRole)) {
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
    const { auth } = await import('@/auth');
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
    if (userRole !== 'ADMIN' && userRole !== 'KINESIOLOGIST') {
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

        const userRole = (session.user as any).role;
        const origen = userRole === 'PATIENT' ? 'PORTAL_PACIENTES' : 'PORTAL_INTERNO';

        await prisma.examenMedico.create({
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

        // Audit Log
        await prisma.systemLog.create({
            data: {
                action: 'UPLOAD_EXAM',
                details: `Patient: ${patientId}, File: ${file.name}, Origin: ${origen}`,
                userId: session.user.id || 'system',
                userEmail: session.user.email || 'system',
                ipAddress: '::1'
            }
        });

        revalidatePath(`/patients/${patientId}/history`);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { message: 'Error al procesar el archivo: ' + (e as Error).message };
    }
}

export async function adminCreateSystemUser(prevState: any, formData: FormData) {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    if ((session.user as any).role !== 'ADMIN') return { message: 'Unauthorized: Admin access required' };

    // Handle separate RUT fields if present
    const rutBody = formData.get('rutBody') as string;
    const rutDv = formData.get('rutDv') as string;
    let rut = formData.get('rut') as string;

    if (rutBody && rutDv) {
        // Simple formatting: remove dots from body, uppercase DV
        const cleanBody = rutBody.replace(/\D/g, '');
        // Just verify basic structure before formatting
        if (!cleanBody || cleanBody.length < 1) {
            return { message: 'RUT inválido. El cuerpo debe ser numérico.' };
        }
        rut = `${cleanBody}-${rutDv.toUpperCase()}`;
    }

    const rawData: Record<string, any> = {
        ...Object.fromEntries(formData),
        rut: rut || '', // Ensure no undefined
        active: formData.get('active') === 'on'
    };

    // Remove individual fields to avoid schema errors if strict
    delete rawData.rutBody;
    delete rawData.rutDv;

    const validation = AdminCreateSystemUserSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { name, email, role, active } = validation.data;
    const password = validation.data.password || '';
    rut = validation.data.rut; // Use validated/transformed RUT

    // Prevent creation of new ADMIN users
    if (role === 'ADMIN') {
        return { message: 'No se puede crear otro administrador. Solo puede existir un administrador en el sistema.' };
    }

    // Validate RUT format - using clean logic
    // RUT should be like "10904419-9" (no dots) or "10904419-9" with dots depending on what frontend sends
    // validarRutChileno handles determining format
    if (!validarRutChileno(rut)) {
        return { message: 'RUT inválido. Verifica el formato y dígito verificador.' };
    }

    // Check if user exists using FHIR adapter
    const existingPersona = await checkPersonaExists(rut, email);
    if (existingPersona) {
        if (existingPersona.email === email) {
            return { message: 'El email ya existe' };
        }
        if (existingPersona.rut === rut) {
            return { message: 'RUT ya está en uso por otro usuario' };
        }
    }

    // Parse name using helper
    const { parseFullName } = await import('./utils');
    const { nombre, apellidoPaterno, apellidoMaterno } = parseFullName(name);

    // Map legacy role to RolUsuario enum
    const rolMap: Record<string, any> = {
        'KINESIOLOGIST': 'KINESIOLOGO',
        'ADMIN': 'ADMIN',
        'RECEPTIONIST': 'RECEPCIONISTA',
    };
    const rolEnum = rolMap[role] || 'RECEPCIONISTA';

    try {
        // Use FHIR adapter to create staff user
        await createStaffUser({
            rut,
            nombre: nombre || name,
            apellidoPaterno: apellidoPaterno || 'SIN_APELLIDO',
            apellidoMaterno,
            email,
            password,
            rol: rolEnum,
            creadoPor: session.user.email || 'ADMIN'
        });
        await logAction('CREATE_SYSTEM_USER', `User created: ${email}, Role: ${role}`, (session.user as any).id, session.user.email);
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error al crear usuario' };
    }
}

export async function adminUpdateSystemUser(prevState: any, formData: FormData) {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    if ((session.user as any).role !== 'ADMIN') return { message: 'Unauthorized: Admin access required' };

    // Handle separate RUT fields if present for update
    const rutBody = formData.get('rutBody') as string;
    const rutDv = formData.get('rutDv') as string;
    let rut = formData.get('rut') as string;

    if (rutBody && rutDv) {
        const cleanBody = rutBody.replace(/\D/g, '');
        if (cleanBody && cleanBody.length > 0) {
            rut = `${cleanBody}-${rutDv.toUpperCase()}`;
        }
    }

    const rawData: Record<string, any> = {
        ...Object.fromEntries(formData),
        rut: rut || '',
        active: formData.get('active') === 'on'
    };

    // Remove separate fields
    delete rawData.rutBody;
    delete rawData.rutDv;

    // Handle optional password
    if (rawData.password === '' || rawData.password === undefined) {
        delete rawData.password;
    }

    const validation = AdminUpdateSystemUserSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    // Extract validated data (rut is here)
    const { id, name, email, role, active } = validation.data;
    rut = validation.data.rut || ''; // Use validated rut or empty string

    // Validate RUT format if provided
    if (rut && !validarRutChileno(rut)) {
        return { message: 'RUT inválido. Verifica el formato y dígito verificador.' };
    }

    // Check if email exists for ANOTHER user
    const existingUser = await prisma.user.findFirst({
        where: {
            email,
            id: { not: id }
        }
    });

    if (existingUser) {
        return { message: 'El email ya está en uso por otro usuario.' };
    }

    if (rut) {
        const existingUserByRut = await prisma.user.findFirst({
            where: {
                rut,
                id: { not: id }
            }
        });
        if (existingUserByRut) return { message: 'El RUT ya está en uso por otro usuario.' };
    }

    // Check if target user is ADMIN
    const targetUser = await prisma.user.findUnique({ where: { id } });

    // If editing an ADMIN, only allow the admin to edit themselves
    if (targetUser?.role === 'ADMIN') {
        // Check if the current user is trying to edit another admin
        if (session.user.email !== targetUser.email) {
            return { message: 'Solo el administrador puede editar su propia cuenta.' };
        }

        // Allow name, email, and password changes for self-editing
        const updateData: any = {
            name,
            email,
            role: 'ADMIN', // Force keep ADMIN role
            active: true   // Force keep active
        };

        // Add password if provided in formData
        const rawPassword = formData.get('password');
        if (rawPassword && typeof rawPassword === 'string' && rawPassword.trim() !== '') {
            const hashedPassword = await bcrypt.hash(rawPassword, 10);
            updateData.password = hashedPassword;
        }

        try {
            await prisma.user.update({
                where: { id },
                data: updateData
            });
            await logAction('UPDATE_ADMIN_USER', `Admin user updated: ${email}`, (session.user as any).id, session.user.email);
            revalidatePath('/dashboard');
            return { message: 'Success' };
        } catch (e) {
            console.error(e);
            return { message: 'Error al actualizar administrador' };
        }
    }

    // For non-admin users, allow full edits
    const updateData: any = {
        name,
        email,
        role,
        active
    };

    // Add password if provided
    const rawPassword = formData.get('password');
    if (rawPassword && typeof rawPassword === 'string' && rawPassword.trim() !== '') {
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        updateData.password = hashedPassword;
    }

    try {
        await prisma.user.update({
            where: { id },
            data: updateData
        });
        await logAction('UPDATE_SYSTEM_USER', `User updated: ${email}, Role: ${role}`, (session.user as any).id, session.user.email);
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error al actualizar usuario' };
    }
}

export async function toggleRolePermission(role: string, action: string, enabled: boolean) {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        await prisma.rolePermission.upsert({
            where: { role_action: { role, action } },
            create: { role, action, enabled },
            update: { enabled }
        });

        await logAction('UPDATE_PERMISSION', `Role: ${role}, Action: ${action} -> ${enabled}`, (session.user as any).id, session.user.email);
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        return { message: 'Error updating permission' };
    }
}

export async function changePassword(formData: FormData) {
    const { auth } = await import('@/auth');
    const session = await auth();

    // Safety check: User must be logged in
    if (!session?.user?.email) {
        return { message: 'Unauthorized' };
    }

    const newPassword = formData.get('newPassword') as string;

    if (!newPassword || newPassword.length < 6) {
        return { message: 'La contraseña debe tener al menos 6 caracteres' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                password: hashedPassword,
                mustChangePassword: false
            }
        });

        await logAction('PASSWORD_CHANGE', `User ${session.user.email} changed password`, null, session.user.email);
    } catch (e) {
        console.error('[changePassword] Error:', e);
        return { message: 'Error al cambiar la contraseña' };
    }

    // Sign out to refresh session (JWT token needs to be regenerated)
    await signOut({ redirect: false });

    // Redirect to login with success message
    redirect('/intranet/login?passwordChanged=true');
}

export async function seedPermissions() {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    const actions = [
        // Módulos Principales
        'Ver Agendamiento',
        'Ver Pacientes',
        'Ver Reportes BI',
        'Ver Asistente',
        'Ver HL7',
        'Configuración Global',
        'Ver Usuarios'
    ];

    const defaultPermissions = [
        // KINE
        { role: 'KINESIOLOGIST', action: 'Crear Pacientes', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Ver Pacientes', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Editar Pacientes', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Eliminar Pacientes', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Ver Reportes BI', enabled: true },
        // RECEP
        { role: 'RECEPTIONIST', action: 'Crear Pacientes', enabled: true },
        { role: 'RECEPTIONIST', action: 'Ver Pacientes', enabled: true },
        { role: 'RECEPTIONIST', action: 'Editar Pacientes', enabled: true },
    ];

    try {
        // Delete old permissions that might conflict or be obsolete (Optional, but cleaner for a re-seed)
        // await prisma.rolePermission.deleteMany({}); 
        // Better to just upsert everything.

        for (const action of actions) {
            for (const role of ['KINESIOLOGIST', 'RECEPTIONIST']) {
                // Check if specific default exists
                const specific = defaultPermissions.find(p => p.role === role && p.action === action);
                const enabled = specific ? specific.enabled : false;

                await prisma.rolePermission.upsert({
                    where: { role_action: { role, action } },
                    update: {}, // Don't overwrite if exists to preserve manual changes? Or overwrite? 
                    // Plan implies we want to seed new structure. 
                    // If we change action names (e.g. 'Gestionar Usuarios' -> 'Ver Usuarios'), old ones remain unless deleted.
                    // For now, let's just create the new ones. Old ones like 'Gestionar Usuarios' will become orphan in UI if we don't render them, or we can clean them up.
                    create: { role, action, enabled }
                });
            }
        }
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error seeding permissions' };
    }
}

export async function bulkUpdateRolePermissions(role: string, enabled: boolean) {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        // This updates ALL permissions for the role. 
        // Note: This relies on the RolePermission table containing entries for all actions for this role.
        // seedPermissions ensures they exist.

        // We want to update only the actions that ARE defined in the system (we don't want to enable obsolete ones if any).
        // But simply updating all where role matches is efficient.

        await prisma.rolePermission.updateMany({
            where: { role },
            data: { enabled }
        });

        await logAction('BULK_UPDATE_PERMISSION', `Role: ${role} -> ALL ${enabled}`, (session.user as any).id, session.user.email);
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error updating bulk permissions' };
    }
}



export async function updateRolePermissions(changes: Array<{ role: string, action: string, enabled: boolean }>) {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        // Run all updates in parallel (or transaction if critical, but parallel is fine for non-relational integrity logic)
        // Upsert ensures we handle cases where a permission might not exist yet (though seed usually handles it)
        await prisma.$transaction(
            changes.map(change =>
                prisma.rolePermission.upsert({
                    where: { role_action: { role: change.role, action: change.action } },
                    create: { role: change.role, action: change.action, enabled: change.enabled },
                    update: { enabled: change.enabled }
                })
            )
        );

        await logAction('BATCH_UPDATE_PERMISSIONS', `Updated ${changes.length} permissions`, (session.user as any).id, session.user.email);
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error updating permissions batch' };
    }
}


export async function adminDeleteSystemUser(id: string) {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return { message: 'Usuario no encontrado' };

        // Prevent deletion of admin users
        if (targetUser.role === 'ADMIN') {
            return { message: 'No se puede eliminar a un Administrador.' };
        }

        await prisma.user.delete({ where: { id } });
        await logAction('DELETE_SYSTEM_USER', `User deleted: ${targetUser.email}`, (session.user as any).id, session.user.email);
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error al eliminar usuario' };
    }
}

export async function reviewMedicalExam(examId: string) {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'KINESIOLOGIST') {
        return { message: 'Unauthorized' };
    }

    try {
        await prisma.medicalExam.update({
            where: { id: examId },
            data: { reviewed: true }
        });
        revalidatePath('/dashboard');
        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error marking exam as reviewed' };
    }
}
