
import prisma from "@/lib/prisma";
import DashboardContent from "@/components/DashboardContent";

export default async function DashboardPage() {
    const patients = await prisma.patient.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
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

    const logs = await prisma.systemLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const permissions = await prisma.rolePermission.findMany();

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
        patients={patients}
        initialUsers={systemUsers}
        logs={logs}
        initialPermissions={permissionMatrix}
    />;

}
