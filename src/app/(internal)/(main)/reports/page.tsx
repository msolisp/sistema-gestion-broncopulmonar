
import { Activity, BarChart3, PieChart } from "lucide-react"
import prisma from "@/lib/prisma";
import BiReportsContent from "@/components/BiReportsContent";
import { protectRoute } from "@/lib/route-protection";

export default async function ReportsPage() {
    // Protect route - only users with "Ver Reportes BI" permission
    await protectRoute({
        requiredPermission: 'Ver Reportes BI',
        redirectTo: '/dashboard'
    });

    const personas = await prisma.persona.findMany({
        include: {
            fichaClinica: {
                include: {
                    examenes: {
                        select: {
                            nombreCentro: true,
                            nombreDoctor: true,
                            fechaExamen: true,
                        }
                    }
                }
            }
        }
    });

    const patients = personas.map(p => ({
        id: p.id,
        commune: p.comuna || 'Sin Comuna',
        // Use fechaDiagnostico or creadoEn as diagnosis date
        diagnosisDate: p.fichaClinica?.fechaDiagnostico || p.fichaClinica?.creadoEn || p.creadoEn,
        birthDate: p.fechaNacimiento,
        gender: p.sexo,
        healthSystem: p.fichaClinica?.prevision || 'No Informado',
        rut: p.rut,
        exams: p.fichaClinica?.examenes.map(e => ({
            centerName: e.nombreCentro,
            doctorName: e.nombreDoctor,
            examDate: e.fechaExamen
        })) || []
    }));

    return <BiReportsContent patients={patients} />;
}

