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

        // Get Patient Profile ID
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { patientProfile: true }
        })

        if (!user?.patientProfile) {
            return { error: "Perfil de paciente no encontrado", message: "" }
        }

        await prisma.appointment.create({
            data: {
                patientId: user.patientProfile.id,
                date: appointmentDate,
                status: "PENDING",
                notes: "Reserva web"
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

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { patientProfile: true }
    })

    if (!user?.patientProfile) return []

    const appointments = await prisma.appointment.findMany({
        where: { patientId: user.patientProfile.id },
        orderBy: { date: 'desc' }
    })

    return appointments
}
