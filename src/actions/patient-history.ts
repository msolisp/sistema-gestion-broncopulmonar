'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getPatientHistory() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return { error: "No autorizado" };
        }

        // Find Persona by Email (since ID might vary depending on auth provider strategy, but email is constant)
        // Alternatively, use session.user.id if it maps to Persona.id
        const persona = await prisma.persona.findUnique({
            where: { email: session.user.email },
            include: {
                fichaClinica: {
                    include: {
                        pruebasFuncion: {
                            orderBy: { fecha: 'asc' }
                        }
                    }
                }
            }
        });

        if (!persona || !persona.fichaClinica) {
            return { error: "Ficha clínica no encontrada" };
        }

        // Map to UI format
        const tests = persona.fichaClinica.pruebasFuncion.map((test: any) => ({
            id: test.id,
            date: test.fecha,
            cvfPercent: test.cvfPercent,
            vef1Percent: test.vef1Percent,
            dlcoPercent: test.dlcoPercent,
            walkDistance: test.walkDistance
        }));

        return { tests };

    } catch (error) {
        console.error("Error fetching patient history:", error);
        return { error: "Error al cargar historial" };
    }
}
