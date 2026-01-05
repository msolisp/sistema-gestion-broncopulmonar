'use server';

import prisma from './prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function addPulmonaryRecord(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) {
        return { message: 'No autenticado' };
    }

    // RBAC: Only ADMIN or KINESIOLOGIST can add records
    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'KINESIOLOGIST') {
        return { message: 'No autorizado: Se requieren privilegios de administrador o kinesiólogo.' };
    }

    const patientId = formData.get('patientId') as string;
    const date = formData.get('date') as string; // YYYY-MM-DD
    const notes = formData.get('notes') as string;

    // TM6M
    const walkDistance = formData.get('walkDistance') ? parseFloat(formData.get('walkDistance') as string) : null;
    const spo2Rest = formData.get('spo2Rest') ? parseInt(formData.get('spo2Rest') as string) : null;
    const spo2Final = formData.get('spo2Final') ? parseInt(formData.get('spo2Final') as string) : null;

    // Spirometry
    const cvfValue = formData.get('cvfValue') ? parseFloat(formData.get('cvfValue') as string) : null;
    const cvfPercent = formData.get('cvfPercent') ? parseInt(formData.get('cvfPercent') as string) : null;
    const vef1Value = formData.get('vef1Value') ? parseFloat(formData.get('vef1Value') as string) : null;
    const vef1Percent = formData.get('vef1Percent') ? parseInt(formData.get('vef1Percent') as string) : null;

    // DLCO
    const dlcoPercent = formData.get('dlcoPercent') ? parseInt(formData.get('dlcoPercent') as string) : null;

    try {
        await prisma.pulmonaryFunctionTest.create({
            data: {
                patientId,
                date: new Date(date),
                notes,
                walkDistance,
                spo2Rest,
                spo2Final,
                cvfValue,
                cvfPercent,
                vef1Value,
                vef1Percent,
                dlcoPercent
            }
        });

        revalidatePath(`/dashboard/patients/${patientId}`);
        return { message: 'Registro guardado exitosamente' };
    } catch (error) {
        console.error('Error adding pulmonary record:', error);
        return { message: 'Error al guardar el registro' };
    }
}

export async function getPulmonaryHistory(patientId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const userRole = (session.user as any).role;

    // RBAC: Admin/Kin can see all. Patient can only see their own.
    if (userRole === 'PATIENT') {
        // IDOR Check: Verify if the requested patientId belongs to the current user
        // For patients, the session ID IS the patient ID
        if (patientId !== session.user.id) {
            console.warn(`IDOR Attempt blocked: User ${session.user.id} tried to access patient ${patientId}`);
            return [];
        }
    }

    try {
        const history = await prisma.pulmonaryFunctionTest.findMany({
            where: { patientId },
            orderBy: { date: 'asc' } // Oldest first for charts
        });
        return history;
    } catch (error) {
        console.error('Error fetching pulmonary history:', error);
        return [];
    }
}
