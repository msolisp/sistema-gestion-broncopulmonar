
import { Activity, BarChart3, PieChart } from "lucide-react"
import prisma from "@/lib/prisma";
import BiReportsContent from "@/components/BiReportsContent";

export default async function ReportsPage() {
    const patients = await prisma.patient.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    rut: true,
                },
            },
            exams: {
                select: {
                    centerName: true,
                    doctorName: true,
                    examDate: true,
                }
            }
        },
    });

    // Cast to any to avoid temporary type mismatch after schema update
    return <BiReportsContent patients={patients as any} />;
}

