'use server'

import prisma from '@/lib/prisma';
import { BookAppointmentSchema } from './schemas';
import { auth } from '@/auth';

export async function bookAppointment(prevState: any, formData: FormData) {
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
