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
    if (!session?.user?.id) {
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

        // Verify Patient exists (direct check)
        const patient = await prisma.patient.findUnique({
            where: { id: session.user.id }
        })

        if (!patient) {
            return { error: "Perfil de paciente no encontrado", message: "" }
        }

        await prisma.appointment.create({
            data: {
                patientId: session.user.id,
                date: appointmentDate,
                status: "CONFIRMED",
                notes: "Reserva web confirmada"
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
    if (!session?.user?.id) return []

    const patient = await prisma.patient.findUnique({
        where: { id: session.user.id }
    })

    if (!patient) return []

    const appointments = await prisma.appointment.findMany({
        where: { patientId: session.user.id },
        orderBy: { date: 'desc' }
    })

    return appointments
}

export async function cancelAppointment(appointmentId: string, reason: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { error: "No autorizado" }
    }

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { patient: true }
        })

        if (!appointment) {
            return { error: "Cita no encontrada" }
        }

        // Verify ownership
        if (appointment.patientId !== session.user.id) {
            return { error: "No tienes permiso para cancelar esta cita" }
        }

        // Verify status
        if (appointment.status === 'CANCELLED') {
            return { error: "La cita ya está cancelada" }
        }

        // Update status and append reason to notes
        const newNotes = appointment.notes
            ? `${appointment.notes}\n[Cancelada por Paciente]: ${reason}`
            : `[Cancelada por Paciente]: ${reason}`;

        await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: 'CANCELLED',
                notes: newNotes
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
