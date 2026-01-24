import { auth } from "@/auth";
import PatientNavbar from "@/components/PatientNavbar";
import SessionTimeout from "@/components/SessionTimeout";
import prisma from "@/lib/prisma";

export default async function PatientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    let initialName = "";

    if (session?.user?.name && session.user.name !== "Admin User" && session.user.name !== "Paciente") {
        initialName = session.user.name.split(' ')[0];
    }

    // Fetch Patient Role permissions
    const patientRole = await prisma.rol.findFirst({
        where: { nombre: 'PACIENTE' },
        include: { permisos: true }
    });

    const activePermissions = patientRole?.permisos.filter(p => p.activo).map(p => ({
        recurso: p.recurso,
        accion: p.accion
    })) || [];

    return (
        <div className="min-h-screen bg-zinc-50">
            <SessionTimeout />
            <PatientNavbar initialUserName={initialName} serverPermissions={activePermissions} />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
