import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// GET - Fetch unread notifications
export async function GET() {
    try {
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

        // Fetch unread notifications
        const notifications = await prisma.notification.findMany({
            where: { read: false },
            include: {
                patient: {
                    select: {
                        id: true,
                        nombre: true,
                        apellidoPaterno: true,
                        email: true,
                        rut: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to 50 most recent
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Mark notification as read
export async function POST(req: Request) {
    try {
        const session = await auth()

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userRole = (session.user as any).role
        const allowedRoles = ['ADMIN', 'KINESIOLOGO', 'RECEPCIONISTA']

        if (!allowedRoles.includes(userRole)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const body = await req.json()
        const { id, markAllAsRead } = body

        if (markAllAsRead) {
            // Mark all notifications as read
            await prisma.notification.updateMany({
                where: { read: false },
                data: { read: true },
            })
            return NextResponse.json({ success: true, message: 'All notifications marked as read' })
        }

        if (!id) {
            return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
        }

        // Mark single notification as read
        await prisma.notification.update({
            where: { id },
            data: { read: true },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating notification:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
