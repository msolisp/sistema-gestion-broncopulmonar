import { NextResponse } from 'next/server'
import { auth } from '../../../auth'
import prisma from '../../../lib/prisma'

export async function GET() {
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
        const personas = await prisma.persona.findMany({
            where: {
                usuarioSistema: null // Only patients
            },
            select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                rut: true,
                email: true,
                comuna: true,
                direccion: true,
                activo: true,
                region: true,
                fichaClinica: {
                    select: {
                        _count: {
                            select: { pruebasFuncion: true }
                        }
                    }
                }
            },
            orderBy: [
                { apellidoPaterno: 'asc' as const },
                { nombre: 'asc' as const }
            ]
        })

        // Transform to include examCount and name
        const patientsMapped = personas.map(p => ({
            id: p.id,
            name: `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno || ''}`.trim(),
            rut: p.rut,
            email: p.email,
            commune: p.comuna,
            address: p.direccion,
            active: p.activo,
            region: p.region,
            examCount: p.fichaClinica?._count.pruebasFuncion || 0
        }))

        return NextResponse.json(patientsMapped)
    } catch (error) {
        console.error('Error fetching patients:', error)
        return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
    }
}
