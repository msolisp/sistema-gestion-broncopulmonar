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

        // Find Persona and FichaClinica
        const persona = await prisma.persona.findUnique({
            where: { email: session.user.email },
            include: {
                fichaClinica: true
            }
        });

        if (!persona) {
            return { error: "Perfil de paciente no encontrado" };
        }

        const commune = persona.comuna || 'SANTIAGO';

        // Parallel Fetching for performance
        const [nextCita, stations] = await Promise.all([
            persona.fichaClinica ? prisma.cita.findFirst({
                where: {
                    fichaClinicaId: persona.fichaClinica.id,
                    fecha: { gte: new Date() },
                    estado: { not: 'CANCELADA' }
                },
                orderBy: { fecha: 'asc' },
                select: {
                    fecha: true,
                    estado: true
                }
            }) : null,
            getRealtimeGlobalAQI()
        ]);

        // Process AQI Data logic server-side
        const normalizedCommune = commune.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const stationMatch = stations.find(s =>
            s.commune.includes(normalizedCommune) || normalizedCommune.includes(s.commune)
        ) || stations.find(s => s.commune === 'SANTIAGO');

        // Fetch Patient Permissions
        const patientRole = await prisma.rol.findFirst({
            where: { nombre: 'PACIENTE' },
            include: { permisos: true }
        });

        const activePermissions = patientRole?.permisos.filter(p => p.activo).map(p => p.accion) || [];

        return {
            patient: {
                id: persona.id,
                name: `${persona.nombre} ${persona.apellidoPaterno}`,
                commune: commune
            },
            nextAppointment: nextCita ? { date: nextCita.fecha, status: nextCita.estado } : null,
            userName: session.user.name,
            aqiData: stationMatch || null,
            permissions: activePermissions
        };

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return { error: "Error al cargar datos" };
    }
}
