'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getPatientProfile() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "No autorizado" };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { patientProfile: true }
        });

        if (!user) {
            return { error: "Usuario no encontrado" };
        }

        return { user };

    } catch (error) {
        console.error("Error fetching patient profile:", error);
        return { error: "Error al cargar perfil" };
    }
}
