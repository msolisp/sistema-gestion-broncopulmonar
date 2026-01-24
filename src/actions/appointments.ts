'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const BookingSchema = z.object({
    date: z.string(), // ISO string from form
    timeBlock: z.string(), // "09:00", "10:00", etc.
})

export async function bookAppointment(prevState: any, formData: FormData) {
    const session = await auth()
    if (!session?.user?.email) {
        return { error: "No autorizado", message: "" }
    }

    const rawDate = formData.get("date") as string
    const timeBlock = formData.get("timeBlock") as string

    // Simple validation
    if (!rawDate || !timeBlock) {
        return { error: "Faltan datos de la reserva", message: "" }
    }

    try {
        // Construct DateTime from date and timeBlock
        // date is YYYY-MM-DD, timeBlock is HH:mm
        const appointmentDate = new Date(`${rawDate}T${timeBlock}:00`)

        // Verify Persona exists and has FichaClinica
        const persona = await prisma.persona.findUnique({
            where: { email: session.user.email },
            include: { fichaClinica: true }
        })

        if (!persona || !persona.fichaClinica) {
            return { error: "Perfil de paciente no encontrado", message: "" }
        }

        await prisma.cita.create({
            data: {
                fichaClinicaId: persona.fichaClinica.id,
                fecha: appointmentDate,
                estado: "CONFIRMADA",
                notas: "Reserva web confirmada"
            }
        })

        revalidatePath("/portal")
        revalidatePath("/portal/citas")
        return { message: "Success", error: "" }

    } catch (error) {
        console.error("Booking error:", error)
        return { error: "Error al crear la reserva", message: "" }
    }
}

export async function getMyAppointments() {
    const session = await auth()
    if (!session?.user?.email) return []

    const persona = await prisma.persona.findUnique({
        where: { email: session.user.email },
        include: { fichaClinica: true }
    })

    if (!persona || !persona.fichaClinica) return []

    const citas = await prisma.cita.findMany({
        where: { fichaClinicaId: persona.fichaClinica.id },
        orderBy: { fecha: 'desc' }
    })

    // Map to UI model
    return citas.map((c: any) => ({
        id: c.id,
        date: c.fecha,
        status: c.estado === 'CONFIRMADA' ? 'CONFIRMED' : (c.estado === 'CANCELADA' ? 'CANCELLED' : 'PENDING'),
        notes: c.notas
    }))
}

export async function cancelAppointment(appointmentId: string, reason: string) {
    const session = await auth()
    if (!session?.user?.email) {
        return { error: "No autorizado" }
    }

    try {
        const persona = await prisma.persona.findUnique({
            where: { email: session.user.email },
            include: { fichaClinica: true }
        })

        if (!persona?.fichaClinica) {
            return { error: "Paciente no encontrado" }
        }

        const cita = await prisma.cita.findUnique({
            where: { id: appointmentId },
        })

        if (!cita) {
            return { error: "Cita no encontrada" }
        }

        // Verify ownership
        if (cita.fichaClinicaId !== persona.fichaClinica.id) {
            return { error: "No tienes permiso para cancelar esta cita" }
        }

        // Verify status
        if (cita.estado === 'CANCELADA') {
            return { error: "La cita ya está cancelada" }
        }

        // Update status and append reason to notes
        const newNotes = cita.notas
            ? `${cita.notas}\n[Cancelada por Paciente]: ${reason}`
            : `[Cancelada por Paciente]: ${reason}`;

        await prisma.cita.update({
            where: { id: appointmentId },
            data: {
                estado: 'CANCELADA',
                notas: newNotes
            }
        })

        revalidatePath("/portal")
        revalidatePath("/portal/citas")
        return { message: "Cita cancelada exitosamente" }

    } catch (error) {
        console.error("Cancel error:", error)
        return { error: "Error al cancelar la cita" }
    }
}
