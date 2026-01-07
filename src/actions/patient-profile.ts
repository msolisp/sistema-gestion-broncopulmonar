'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getPatientProfile() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return { error: "No autorizado" };
        }

        // Try getting by ID first, then Email
        let user = null;

        if (session.user.id) {
            user = await prisma.patient.findUnique({
                where: { id: session.user.id }
            });
        }

        if (!user) {
            user = await prisma.patient.findUnique({
                where: { email: session.user.email }
            });
        }

        if (!user) {
            return { error: "Perfil no encontrado" };
        }

        return { user };

    } catch (error) {
        console.error("Error fetching patient profile:", error);
        return { error: "Error al cargar perfil" };
    }
}
