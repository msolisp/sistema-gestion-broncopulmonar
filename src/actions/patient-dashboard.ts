'use server';

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { getRealtimeGlobalAQI, AQIData } from "@/lib/air-quality";

export async function getPatientDashboardData() {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return { error: "No autorizado" };
        }

        const patient = await prisma.patient.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                commune: true
            }
        });

        if (!patient) {
            return { error: "Perfil de paciente no encontrado" };
        }

        // Parallel Fetching for performance
        const [nextAppointment, stations] = await Promise.all([
            prisma.appointment.findFirst({
                where: {
                    patientId: patient.id,
                    date: { gte: new Date() },
                    status: { not: 'CANCELLED' }
                },
                orderBy: { date: 'asc' },
                select: {
                    date: true,
                    status: true
                }
            }),
            getRealtimeGlobalAQI()
        ]);

        // Process AQI Data logic server-side
        const normalizedCommune = patient.commune.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const stationMatch = stations.find(s =>
            s.commune.includes(normalizedCommune) || normalizedCommune.includes(s.commune)
        ) || stations.find(s => s.commune === 'SANTIAGO');

        return {
            patient,
            nextAppointment,
            userName: session.user.name,
            aqiData: stationMatch || null
        };

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return { error: "Error al cargar datos" };
    }
}
