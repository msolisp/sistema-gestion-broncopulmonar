'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getPatientProfile() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return { error: "No autorizado" };
        }

        // Try getting by ID first, then Email using Persona model
        let persona = null;

        if (session.user.id) {
            persona = await prisma.persona.findUnique({
                where: { id: session.user.id },
                include: { fichaClinica: true }
            });
        }

        if (!persona) {
            persona = await prisma.persona.findUnique({
                where: { email: session.user.email },
                include: { fichaClinica: true }
            });
        }

        if (!persona) {
            return { error: "Perfil no encontrado" };
        }

        // Map Persona to expected User structure
        const user = {
            id: persona.id,
            name: `${persona.nombre} ${persona.apellidoPaterno} ${persona.apellidoMaterno || ''}`.trim(),
            email: persona.email,
            rut: persona.rut,
            address: persona.direccion,
            commune: persona.comuna,
            region: persona.region,
            phone: persona.telefono,
            birthDate: persona.fechaNacimiento,
            gender: persona.sexo === 'M' ? 'Masculino' : (persona.sexo === 'F' ? 'Femenino' : (persona.sexo === 'OTRO' ? 'Otro' : '')),
            healthSystem: persona.fichaClinica?.prevision,
            cota: persona.fichaClinica?.cota,
        };

        return { user };

    } catch (error) {
        console.error("Error fetching patient profile:", error);
        return { error: "Error al cargar perfil" };
    }
}
