import prisma from "@/lib/prisma";
import PatientsTable from "@/components/PatientsTable";

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
    const patients = await prisma.patient.findMany({
        include: {
            user: true,
            appointments: true
        }
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-zinc-900">Gestión de Pacientes</h2>
            <PatientsTable patients={patients as any} />
        </div>
    )
}
