import prisma from "@/lib/prisma";
import PatientsTable from "@/components/PatientsTable";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { protectRoute } from "@/lib/route-protection";

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
    // Protect route - only users with "Ver Pacientes" permission
    await protectRoute({
        requiredPermission: 'Ver Pacientes',
        redirectTo: '/portal'
    });

    // Query from new Persona table with related data
    const personas = await prisma.persona.findMany({
        where: {
            activo: true,  // Only active patients
            fichaClinica: { isNot: null } // Only actual patients (with clinical record)
        },
        include: {
            fichaClinica: {
                include: {
                    citas: true  // Include appointments for count
                }
            }
        },
        orderBy: {
            creadoEn: 'desc'
        }
    });

    // Transform Persona data to match PatientsTable interface
    const patients = personas.map(persona => ({
        id: persona.id,
        name: `${persona.nombre} ${persona.apellidoPaterno}${persona.apellidoMaterno ? ' ' + persona.apellidoMaterno : ''}`,
        rut: persona.rut,
        email: persona.email,
        commune: persona.comuna,
        region: persona.region || '',
        address: persona.direccion || '',
        active: persona.activo,
        birthDate: persona.fechaNacimiento,
        gender: persona.sexo === 'M' ? 'Masculino' :
            persona.sexo === 'F' ? 'Femenino' :
                persona.sexo === 'OTRO' ? 'Otro' :
                    persona.sexo === 'NO_ESPECIFICADO' ? '' : null,
        diagnosisDate: persona.fichaClinica?.fechaDiagnostico || null,
        createdAt: persona.creadoEn,
        appointments: persona.fichaClinica?.citas || []
    }));

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-zinc-900">Gestión de Pacientes</h2>
            <PatientsTable patients={patients as any} />
        </div>
    )
}
