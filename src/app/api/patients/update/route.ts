import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logAction } from '@/lib/logger'

export async function POST(request: NextRequest) {
    const session = await auth()

    // Check auth and permissions
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const allowedRoles = ['ADMIN', 'KINESIOLOGIST', 'RECEPTIONIST']

    if (!allowedRoles.includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { id, name, region, commune, address, password } = body

        // Validate required fields
        if (!id || !name || !commune || !address) {
            return NextResponse.json({
                message: 'Campos requeridos: nombre, comuna, dirección'
            }, { status: 400 })
        }

        // Prepare update data
        const updateData: any = {
            name,
            region,
            commune,
            address
        }

        // If password is provided, hash it
        if (password && password.trim()) {
            // Validate password
            if (password.length < 8) {
                return NextResponse.json({
                    message: 'La contraseña debe tener al menos 8 caracteres'
                }, { status: 400 })
            }
            if (!/[A-Z]/.test(password)) {
                return NextResponse.json({
                    message: 'La contraseña debe contener al menos una mayúscula'
                }, { status: 400 })
            }
            if (!/[a-z]/.test(password)) {
                return NextResponse.json({
                    message: 'La contraseña debe contener al menos una minúscula'
                }, { status: 400 })
            }
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
                return NextResponse.json({
                    message: 'La contraseña debe contener al menos un carácter especial'
                }, { status: 400 })
            }

            updateData.password = await bcrypt.hash(password, 10)
        }

        // Update patient
        await prisma.patient.update({
            where: { id },
            data: updateData
        })

        // Log action
        await logAction(
            'PATIENT_UPDATED',
            `Patient ${name} updated by ${session.user.email}`,
            null,
            session.user.email
        )

        return NextResponse.json({ message: 'Paciente actualizado correctamente' })
    } catch (error) {
        console.error('Error updating patient:', error)
        return NextResponse.json({
            message: 'Error al actualizar paciente'
        }, { status: 500 })
    }
}
