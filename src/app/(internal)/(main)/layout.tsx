import InternalSidebar from "@/components/InternalSidebar";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import SessionTimeout from "@/components/SessionTimeout";

export const dynamic = 'force-dynamic';

export default async function InternalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    let permissions: string[] = [];

    if (session?.user?.role && session.user.role !== 'ADMIN') {
        const userRole = session.user.role;

        // Fetch active permissions for the role
        const rolePermissions = await prisma.permisoRol.findMany({
            where: {
                rol: { nombre: userRole },
                activo: true
            }
        });

        // Map DB permissions to Sidebar Actions
        // This mapping must match InternalSidebar.tsx expectations
        // Sidebar checks: 'Ver Agendamiento', 'Ver Pacientes', 'Ver Reportes BI', 'Ver Asistente', 'Ver HL7'

        const MAPPING: Record<string, string> = {
            'Agendamiento': 'Ver Agendamiento',
            'Pacientes': 'Ver Pacientes',
            'Reportes BI': 'Ver Reportes BI',
            'Asistente Clínico': 'Ver Asistente',
            'Estándar HL7': 'Ver HL7'
        };

        permissions = rolePermissions
            .filter((p: any) => p.accion === 'Ver' && MAPPING[p.recurso])
            .map((p: any) => MAPPING[p.recurso]);
    } else if (session?.user?.role === 'ADMIN') {
        // Explicitly give all UI permissions to Admin so Sidebar doesn't rely solely on client-side 'ADMIN' check
        const MAPPING: Record<string, string> = {
            'Agendamiento': 'Ver Agendamiento',
            'Pacientes': 'Ver Pacientes',
            'Reportes BI': 'Ver Reportes BI',
            'Asistente Clínico': 'Ver Asistente',
            'Estándar HL7': 'Ver HL7'
        };
        permissions = Object.values(MAPPING);
    }

    return (
        <div className="flex h-screen bg-zinc-50">
            <SessionTimeout />
            <InternalSidebar user={session?.user} permissions={permissions} />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
