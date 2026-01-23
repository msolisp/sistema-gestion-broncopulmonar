import prisma from "@/lib/prisma";
import DashboardContent from "@/components/DashboardContent";
import { auth } from "@/auth";
import { protectRoute } from "@/lib/route-protection";
import { UserRole } from "@/components/admin/users/types";

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    // Protect route - only internal staff allowed
    await protectRoute({
        allowedRoles: ['ADMIN', 'KINESIOLOGIST', 'RECEPTIONIST'],
        redirectTo: '/portal'
    });

    // protectRoute already validated session
    const session = await auth();

    const systemUsers = await prisma.user.findMany({
        where: {
            role: {
                in: ['ADMIN', 'KINESIOLOGIST', 'RECEPTIONIST']
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true
        }
    });

    // Date Filters for Audit Logs
    const fromDate = typeof searchParams?.auditFrom === 'string' ? new Date(searchParams.auditFrom) : undefined;
    const toDate = typeof searchParams?.auditTo === 'string' ? new Date(searchParams.auditTo) : undefined;

    // Adjust toDate to end of day if present
    if (toDate) {
        toDate.setHours(23, 59, 59, 999);
    }

    const logsRaw = await prisma.systemLog.findMany({
        where: {
            createdAt: {
                gte: fromDate,
                lte: toDate
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 100 // Increased limit for filtered views
    });

    const logs = logsRaw.map((log: any) => ({
        ...log,
        createdAt: log.createdAt.toISOString()
    }));

    // Fetch Pending Exams (Uploaded by Patient & Not Reviewed)
    const pendingExamsRaw = await prisma.examenMedico.findMany({
        where: {
            origen: 'PORTAL_PACIENTE',
            revisado: false
        },
        include: {
            fichaClinica: {
                include: {
                    persona: {
                        select: { id: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true, rut: true }
                    }
                }
            }
        },
        orderBy: { fechaExamen: 'asc' }
    });

    const pendingExams = pendingExamsRaw.map((exam: any) => ({
        id: exam.id,
        fileName: exam.nombreArchivo,
        fileUrl: exam.urlArchivo,
        examDate: exam.fechaExamen.toISOString(),
        patient: {
            id: exam.fichaClinica.persona.id,
            name: `${exam.fichaClinica.persona.nombre} ${exam.fichaClinica.persona.apellidoPaterno} ${exam.fichaClinica.persona.apellidoMaterno || ''}`.trim(),
            rut: exam.fichaClinica.persona.rut
        }
    }));

    const permissions = await prisma.rolePermission.findMany();

    const appointmentsRaw = await prisma.cita.findMany({
        include: {
            fichaClinica: {
                include: {
                    persona: {
                        select: { nombre: true, apellidoPaterno: true, apellidoMaterno: true, email: true, rut: true }
                    }
                }
            }
        },
        orderBy: { fecha: 'desc' },
        take: 100 // Limit for performance
    });
    const appointments = appointmentsRaw.map((apt: any) => ({
        id: apt.id,
        date: apt.fecha.toISOString(),
        status: apt.estado,
        notes: apt.notas,
        patient: {
            name: `${apt.fichaClinica.persona.nombre} ${apt.fichaClinica.persona.apellidoPaterno} ${apt.fichaClinica.persona.apellidoMaterno || ''}`.trim(),
            email: apt.fichaClinica.persona.email,
            rut: apt.fichaClinica.persona.rut
        }
    }));

    // Transform permissions for Matrix [Action][Role] = boolean
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
        pendingExams={pendingExams}
        currentUserRole={(session?.user?.role as UserRole) || 'KINESIOLOGIST'}
    />;
}
