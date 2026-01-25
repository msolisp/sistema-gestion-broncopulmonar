import prisma from "@/lib/prisma";
import DashboardContent from "@/components/DashboardContent";
import { auth } from "@/auth";
import { protectRoute } from "@/lib/route-protection";
import { UserRole } from "@/components/admin/users/types";
import { Suspense } from "react";

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    console.log('--- DASHBOARD PAGE LOADING ---');
    const searchParams = await props.searchParams;
    // Protect route - only internal staff allowed (Patients redirected in middleware)
    await protectRoute({
        redirectTo: '/portal'
    });

    // protectRoute already validated session
    const session = await auth();

    const systemUsersRaw = await prisma.usuarioSistema.findMany({
        where: {
            eliminadoEn: null,
            rol_rel: {
                nombre: {
                    not: 'PACIENTE'
                }
            }
        },
        include: {
            rol_rel: true,
            persona: {
                select: {
                    id: true,
                    nombre: true,
                    apellidoPaterno: true,
                    apellidoMaterno: true,
                    rut: true,
                    email: true,
                    direccion: true,
                    comuna: true,
                    region: true,
                }
            }
        }
    });

    console.log('[DASHBOARD_DEBUG] Fetched Users Count:', systemUsersRaw.length);
    systemUsersRaw.forEach((u: any) => {
        console.log(`[DASHBOARD_DEBUG] User: ${u.persona.nombre}, Role: ${u.rol_rel.nombre}, EliminadoEn: ${u.eliminadoEn}`);
    });

    const roles = await prisma.rol.findMany({
        where: {
            activo: true,
            nombre: { not: 'PACIENTE' }
        }
    });

    const systemUsers = systemUsersRaw.map((u: any) => ({
        id: u.id,
        name: `${u.persona.nombre} ${u.persona.apellidoPaterno} ${u.persona.apellidoMaterno || ''}`.trim(),
        email: u.persona.email,
        role: u.rol_rel.id,
        roleName: u.rol_rel.nombre,
        active: u.activo,
        rut: u.persona.rut,
        region: u.persona.region,
        commune: u.persona.comuna,
        address: u.persona.direccion
    }));

    // Date Filters for Audit Logs
    const fromDate = typeof searchParams?.auditFrom === 'string' ? new Date(searchParams.auditFrom) : undefined;
    const toDate = typeof searchParams?.auditTo === 'string' ? new Date(searchParams.auditTo) : undefined;

    // Adjust toDate to end of day if present
    if (toDate) {
        toDate.setHours(23, 59, 59, 999);
    }

    const logsRaw = await prisma.logAccesoSistema.findMany({
        where: {
            fecha: {
                gte: fromDate,
                lte: toDate
            }
        },
        include: {
            usuario: {
                include: { persona: true }
            }
        },
        orderBy: { fecha: 'desc' },
        take: 100
    });

    const logs = logsRaw.map((log: any) => ({
        id: log.id,
        action: log.accion,
        userEmail: log.usuario?.persona?.email || 'System',
        createdAt: log.fecha.toISOString(),
        details: log.accionDetalle,
        ipAddress: log.ipAddress
    }));

    // Fetch Pending Exams (Uploaded by Patient & Not Reviewed)
    // ... existing exams logic is fine since it uses ExamenMedico ...
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
        fileName: exam.archivoNombre || 'documento.pdf',
        fileUrl: exam.archivoUrl,
        examDate: exam.fechaExamen.toISOString(),
        patient: {
            id: exam.fichaClinica.persona.id,
            name: `${exam.fichaClinica.persona.nombre} ${exam.fichaClinica.persona.apellidoPaterno} ${exam.fichaClinica.persona.apellidoMaterno || ''}`.trim(),
            rut: exam.fichaClinica.persona.rut
        }
    }));

    // Fetch permissions matrix from database (Use PermisoRol for Role Definitions)
    const allRolePermissions = await prisma.permisoRol.findMany({
        where: { activo: true },
        include: { rol: true }
    });

    const modules = [
        { action: 'Ver Agendamiento', recurso: 'Agendamiento', label: 'Ver' },
        { action: 'Ver Pacientes', recurso: 'Pacientes', label: 'Ver' },
        { action: 'Ver Reportes BI', recurso: 'Reportes BI', label: 'Ver' },
        { action: 'Ver Asistente', recurso: 'Asistente Clínico', label: 'Ver' },
        { action: 'Ver HL7', recurso: 'Estándar HL7', label: 'Ver' },
        { action: 'Ver Exámenes Cargados', recurso: 'Notificaciones', label: 'Ver' },
        { action: 'Configuración Global', recurso: 'Configuración Global', label: 'Ver' },
        { action: 'Ver Usuarios', recurso: 'Seguridad (RBAC)', label: 'Ver' }
    ];

    const permissionMatrix = modules.map(m => {
        const rolePerms: Record<string, boolean> = {};

        roles.forEach((role: any) => {
            const hasPerm = allRolePermissions.some((p: any) =>
                p.rol.nombre === role.nombre &&
                p.recurso === m.recurso &&
                (p.accion === 'Ver' || p.accion === m.action)
            );
            rolePerms[role.nombre.toLowerCase()] = hasPerm;
        });

        return {
            action: m.action,
            recurso: m.recurso, // Add strict resource name
            ...rolePerms
        };
    });

    // Fetch Patient Role separately
    const patientRole = await prisma.rol.findFirst({
        where: { nombre: 'PACIENTE' },
        include: { permisos: true }
    });

    const patientModules = [
        { action: 'Mis Citas', recurso: 'Portal_Pacientes', dbAction: 'Ver Citas' },
        { action: 'Historial Médico', recurso: 'Portal_Pacientes', dbAction: 'Ver Historial' },
        { action: 'Mis Datos', recurso: 'Portal_Pacientes', dbAction: 'Ver Perfil' },
        { action: 'Subir Exámenes', recurso: 'Portal_Pacientes', dbAction: 'Subir Examenes' }
    ];

    const patientPermissions = patientModules.map(m => {
        const hasPerm = patientRole ? patientRole.permisos.some((p: any) =>
            p.recurso === m.recurso &&
            p.accion === m.dbAction &&
            p.activo
        ) : false;
        return {
            action: m.action,
            label: 'Ver',
            enabled: hasPerm,
            recurso: m.recurso,
            dbAction: m.dbAction
        };
    });

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
        take: 100
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

    return (
        <Suspense fallback={<div className="p-8 text-center text-zinc-500">Cargando panel...</div>}>
            <DashboardContent
                initialUsers={systemUsers}
                logs={logs}
                initialPermissions={permissionMatrix}
                appointments={appointments}
                pendingExams={pendingExams}
                currentUserRole={(session?.user?.role as any) || 'KINESIOLOGO'}
                currentUserEmail={session?.user?.email || ''}
                initialRoles={roles}
                patientRole={patientRole}
                patientPermissions={patientPermissions}
            />
        </Suspense>
    );
}
