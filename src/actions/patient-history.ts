'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getPatientHistory() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "No autorizado" };
        }

        let patient = await prisma.patient.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        });

        // Self-healing: Create profile if missing
        if (!patient) {
            console.log(`[Auto-Recovery] Creating missing profile for user ${session.user.id}`);
            const timestamp = Date.now();
            patient = await prisma.patient.create({
                data: {
                    userId: session.user.id,
                    rut: `TMP-${timestamp}`, // Temporary RUT to allow access
                    commune: 'SIN INFORMACION', // Default
                    address: 'Por completar',
                    healthSystem: 'FONASA',
                    phone: '',
                    birthDate: new Date()
                },
                select: { id: true }
            });
        }

        const tests = await prisma.pulmonaryFunctionTest.findMany({
            where: { patientId: patient.id },
            orderBy: { date: 'asc' }
        });

        return { tests };

    } catch (error) {
        console.error("Error fetching patient history:", error);
        return { error: "Error al cargar historial" };
    }
}
