'use server'

import { signIn, signOut } from '@/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { logAction } from './logger';
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

        // Pre-check role to determine redirection
        const user = await prisma.user.findUnique({
            where: { email },
            select: { role: true, mustChangePassword: true }
        });

        let redirectTo = '/reservar'; // Default fallback

        if (user) {

            // Check for Forced Password Change
            if (user.mustChangePassword) {
                redirectTo = '/change-password';
            } else if (['ADMIN', 'KINESIOLOGIST', 'RECEPTIONIST'].includes(user.role)) {
                // Strictly Separate Portals
                redirectTo = '/dashboard';
            } else {
                redirectTo = '/portal';
            }
        }

        // Artificial Delay for Rate Limiting to prevent Brute Force
        await new Promise(resolve => setTimeout(resolve, 1000));

        await signIn('credentials', {
            ...rawData,
            redirectTo
        });

        await logAction('LOGIN_SUCCESS', `User ${email} logged in`, null, email);


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
        await logAction('LOGIN_FAILURE', `Failed login attempt for ${email}`, null, email);
        console.error('Login Error:', error);
        throw error;
    }
}

export async function registerPatient(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData);
    const validation = RegisterPatientSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { email, password, name, rut, commune } = validation.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { message: 'Email already exists' };

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await prisma.$transaction(async (tx: any) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: 'PATIENT',
                }
            });

            await tx.patient.create({
                data: {
                    userId: user.id,
                    rut,
                    commune,
                }
            });
        });
    } catch (e) {
        console.error(e)
        return { message: 'Database Error: Failed to Create User' };
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

    const user = await prisma.user.findUnique({
        where: { email: sessionData.user.email },
        include: { patientProfile: true }
    });

    if (!user || !user.patientProfile) {
        return { message: `Patient profile not found for user: ${sessionData.user.email}` };
    }

    try {
        await prisma.appointment.create({
            data: {
                patientId: user.patientProfile.id,
                date: new Date(dateStr),
                notes,
                status: 'PENDING'
            }
        });
    } catch (e) {
        return { message: 'Error booking appointment' };
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
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { name, phone, address, commune, gender, healthSystem, birthDate } = validation.data;

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { patientProfile: true }
        });

        if (!user || !user.patientProfile) {
            return { message: 'Profile not found' };
        }

        console.log('Updating profile for user:', session.user.email, 'Data:', { name, phone, address, commune });

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { name }
            }),
            prisma.patient.update({
                where: { id: user.patientProfile.id },
                data: {
                    phone,
                    address,
                    commune,
                    gender,
                    healthSystem,
                    birthDate: birthDate ? new Date(birthDate) : undefined
                }
            })
        ]);

        revalidatePath('/portal');
        revalidatePath('/portal/perfil');
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
    if ((session.user as any).role !== 'ADMIN') return { message: 'Unauthorized: Admin access required' };

    const rawData = Object.fromEntries(formData);
    const validation = AdminCreatePatientSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { name, email, rut, commune, address, gender, healthSystem, birthDate, password } = validation.data;

    if (!password) {
        return { message: 'La contraseña es obligatoria para nuevos usuarios.' };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { message: 'El email ya existe' };

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await prisma.$transaction(async (tx: any) => {
            const user = await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    role: 'PATIENT',
                    mustChangePassword: true,
                }
            });

            await tx.patient.create({
                data: {
                    userId: user.id,
                    rut,
                    commune,
                    address,
                    gender,
                    healthSystem,
                    birthDate: birthDate ? new Date(birthDate) : undefined
                }
            });
        });
        revalidatePath('/dashboard');
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
    if ((session.user as any).role !== 'ADMIN') return { message: 'Unauthorized: Admin access required' };

    const rawData = {
        ...Object.fromEntries(formData),
        active: formData.get('active') === 'on'
    };
    const validation = AdminUpdatePatientSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { id, name, rut, commune, address, gender, healthSystem, birthDate, diagnosisDate, active } = validation.data;

    try {
        const patient = await prisma.patient.findUnique({ where: { id }, include: { user: true } });
        if (!patient) return { message: 'Paciente no encontrado' };

        await prisma.$transaction([
            prisma.user.update({
                where: { id: patient.userId },
                data: {
                    name,
                    active
                }
            }),
            prisma.patient.update({
                where: { id },
                data: {
                    rut,
                    commune,
                    address,
                    gender,
                    healthSystem,
                    birthDate: birthDate ? new Date(birthDate) : undefined,
                    diagnosisDate: diagnosisDate ? new Date(diagnosisDate) : undefined
                }
            })
        ]);
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
    if ((session.user as any).role !== 'ADMIN') return { message: 'Unauthorized: Admin access required' };

    const rawData = Object.fromEntries(formData);
    const validation = DeletePatientSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos' };
    }

    const { id } = validation.data;

    try {
        const patient = await prisma.patient.findUnique({ where: { id } });
        if (!patient) return { message: 'Paciente no encontrado' };

        await prisma.user.delete({
            where: { id: patient.userId }
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

    // RBAC & IDOR Check
    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'KINESIOLOGIST') {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email as string },
            include: { patientProfile: true }
        });

        if (!user?.patientProfile || user.patientProfile.id !== patientId) {
            return { message: 'No autorizado para subir exámenes a este perfil.' };
        }
    }

    if (file.size === 0) return { message: 'El archivo está vacío' };
    if (file.type !== 'application/pdf') return { message: 'Solo se permiten archivos PDF' };

    try {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const fileName = `${timestamp}-${safeName}`;

        // Upload to Vercel Blob
        const blob = await put(fileName, file, {
            access: 'public',
        });

        const fileUrl = blob.url;

        await prisma.medicalExam.create({
            data: {
                patientId,
                centerName,
                doctorName,
                examDate: new Date(examDate),
                fileUrl,
                fileName: file.name
            }
        });

        revalidatePath(`/patients/${patientId}/history`);
        return { success: true };
    } catch (error) {
        console.error('Upload Error:', error);
        return { message: `Error al subir el archivo: ${(error as Error).message}` };
    }
}

export async function adminCreateSystemUser(prevState: any, formData: FormData) {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email) return { message: 'Unauthorized' };
    if ((session.user as any).role !== 'ADMIN') return { message: 'Unauthorized: Admin access required' };

    const rawData = {
        ...Object.fromEntries(formData),
        active: formData.get('active') === 'on'
    };
    const validation = AdminCreateSystemUserSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { name, email, password, role, active } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return { message: 'El email ya existe' };

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                active: active ?? true,
                mustChangePassword: true
            }
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

    const rawData = {
        ...Object.fromEntries(formData),
        active: formData.get('active') === 'on' // Checkbox handling
    };

    // Zod expects booleans, so we handled it above.
    const validation = AdminUpdateSystemUserSchema.safeParse(rawData);

    if (!validation.success) {
        return { message: 'Datos inválidos: ' + validation.error.issues.map(e => e.message).join(', ') };
    }

    const { id, name, email, role, active } = validation.data;

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

    // Check if target user is ADMIN
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.role === 'ADMIN') {
        // Prevent editing OTHER admins, or any admin? 
        // Request says "protege de edicion al administrador". 
        // Assuming we should NOT edit admins from this generic UI.
        return { message: 'No se puede editar al Administrador Principal desde esta vista.' }


    }

    try {
        await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                role,
                active
            }
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
    if (!session?.user?.email) return { message: 'Unauthorized' };

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

        return { message: 'Success' };
    } catch (e) {
        console.error(e);
        return { message: 'Error al cambiar la contraseña' };
    }
}

export async function seedPermissions() {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    const actions = [
        'Ver Pacientes',
        'Editar Pacientes',
        'Eliminar Pacientes',
        'Ver Reportes BI',
        'Gestionar Usuarios',
        'Configuración Global'
    ];

    const defaultPermissions = [
        // KINE
        { role: 'KINESIOLOGIST', action: 'Ver Pacientes', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Editar Pacientes', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Eliminar Pacientes', enabled: true },
        { role: 'KINESIOLOGIST', action: 'Ver Reportes BI', enabled: true },
        // RECEP
        { role: 'RECEPTIONIST', action: 'Ver Pacientes', enabled: true },
        { role: 'RECEPTIONIST', action: 'Editar Pacientes', enabled: true },
    ];

    try {
        for (const action of actions) {
            for (const role of ['KINESIOLOGIST', 'RECEPTIONIST']) {
                // Check if specific default exists
                const specific = defaultPermissions.find(p => p.role === role && p.action === action);
                const enabled = specific ? specific.enabled : false;

                // Using prisma directly here (imported at top of file, ideally)
                // But wait, prisma is imported at line 4. 
                await prisma.rolePermission.upsert({
                    where: { role_action: { role, action } },
                    update: {}, // Don't overwrite if exists
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


export async function adminDeleteSystemUser(id: string) {
    const { auth } = await import('@/auth');
    const session = await auth();
    if (!session?.user?.email || (session.user as any).role !== 'ADMIN') return { message: 'Unauthorized' };

    try {
        const targetUser = await prisma.user.findUnique({ where: { id } });
        if (!targetUser) return { message: 'Usuario no encontrado' };

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
