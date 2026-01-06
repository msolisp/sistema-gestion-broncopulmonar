
import prisma from "@/lib/prisma";
import DashboardContent from "@/components/DashboardContent";

import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user || session.user.role === 'PATIENT') {
        redirect("/intranet/login");
    }

    const patients = await prisma.patient.findMany({
    });

    const systemUsers = await prisma.user.findMany({
        where: {
            role: {
                in: ['ADMIN', 'KINESIOLOGIST', 'RECEPTIONIST']
            }
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true
        }
    });

    const logsRaw = await prisma.systemLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    });
    const logs = logsRaw.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString()
    }));

    const permissions = await prisma.rolePermission.findMany();

    const appointmentsRaw = await prisma.appointment.findMany({
        include: {
            patient: {
                select: { name: true, email: true, rut: true }
            }
        },
        orderBy: { date: 'desc' },
        take: 100 // Limit for performance
    });
    const appointments = appointmentsRaw.map(apt => ({
        id: apt.id,
        date: apt.date.toISOString(),
        status: apt.status,
        notes: apt.notes,
        patient: apt.patient
    }));

    // Transform permissions for Matrix [Action][Role] = boolean
    // Client expects: { action: string, kine: boolean, recep: boolean }[]
    const actions: string[] = Array.from(new Set(permissions.map((p: any) => p.action)));
    const permissionMatrix = actions.map(action => {
        const kinePerm = permissions.find((p: any) => p.action === action && p.role === 'KINESIOLOGIST');
        const recepPerm = permissions.find((p: any) => p.action === action && p.role === 'RECEPTIONIST');
        return {
            action,
            kine: kinePerm?.enabled ?? false,
            recep: recepPerm?.enabled ?? false
        };
    });

    return <DashboardContent
        initialUsers={systemUsers}
        logs={logs}
        initialPermissions={permissionMatrix}
        appointments={appointments}
    />;

}
