import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET() {
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
        const patients = await prisma.patient.findMany({
            select: {
                id: true,
                name: true,
                rut: true,
                email: true,
                commune: true,
                address: true,
                active: true,
                region: true
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(patients)
    } catch (error) {
        console.error('Error fetching patients:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
