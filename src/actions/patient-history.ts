'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getPatientHistory() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "No autorizado" };
        }

        // Session ID IS the Patient ID for patient users
        const patient = await prisma.patient.findUnique({
            where: { id: session.user.id },
            select: { id: true }
        });

        if (!patient) {
            return { error: "Paciente no encontrado" };
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
