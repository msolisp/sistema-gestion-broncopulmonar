import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logAction } from '@/lib/enhanced-logger'

export async function POST(request: NextRequest) {
    const session = await auth()

    // Check auth and permissions
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role
    const allowedRoles = ['ADMIN', 'KINESIOLOGO', 'RECEPCIONISTA']

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

        // prepare update using FHIR adapter
        const { updatePatient } = await import('@/lib/fhir-adapters');
        const { parseFullName } = await import('@/lib/utils');
        const { nombre, apellidoPaterno, apellidoMaterno } = parseFullName(name);

        await updatePatient(id, {
            nombre: nombre || name,
            apellidoPaterno: apellidoPaterno || 'SIN_APELLIDO',
            apellidoMaterno,
            comuna: commune,
            region,
            direccion: address,
            password: password && password.trim() ? password : undefined,
            modificadoPor: session.user.email || 'SYSTEM'
        });

        // Audit Log
        const userStaff = await prisma.usuarioSistema.findFirst({ where: { persona: { email: session.user.email as string } } });
        if (userStaff) {
            await prisma.logAccesoSistema.create({
                data: {
                    accion: 'PATIENT_UPDATED',
                    accionDetalle: `Patient ${name} updated by ${session.user.email}`,
                    usuarioId: userStaff.id,
                    recurso: 'PERSONA',
                    recursoId: id,
                    ipAddress: '::1'
                }
            });
        }

        return NextResponse.json({ message: 'Paciente actualizado correctamente' })
    } catch (error) {
        console.error('Error updating patient:', error)
        return NextResponse.json({
            message: 'Error al actualizar paciente'
        }, { status: 500 })
    }
}
