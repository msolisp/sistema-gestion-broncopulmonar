'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getPatientProfile() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "No autorizado" };
        }

        // Direct query to Patient table using session ID
        const user = await prisma.patient.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return { error: "Perfil no encontrado" };
        }

        return { user };

    } catch (error) {
        console.error("Error fetching patient profile:", error);
        return { error: "Error al cargar perfil" };
    }
}
