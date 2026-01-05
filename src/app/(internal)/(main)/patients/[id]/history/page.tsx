import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ExamTimeline from "@/components/ExamTimeline";
import ExamUploadForm from "@/components/ExamUploadForm";
import { PulmonaryHistory } from "@/components/PulmonaryHistory";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function PatientHistoryPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) return notFound();

    const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
            exams: true
        }
    });

    if (!patient) return notFound();

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/patients"
                    className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Volver a Pacientes
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900">Historial Médico</h1>
                        <p className="text-zinc-500 mt-1">
                            Paciente: <span className="font-semibold text-zinc-900">{patient.name}</span> | RUT: {patient.rut}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                {/* Upload Section - Full Width Canvas */}
                <div className="w-full">
                    <ExamUploadForm patientId={patient.id} />
                </div>

                {/* Timeline Section */}
                <div className="border-t border-zinc-100 pt-8">
                    <h2 className="text-xl font-bold text-zinc-900 mb-8 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 h-8 w-8 rounded-full flex items-center justify-center text-sm">
                            {patient.exams.length}
                        </span>
                        Exámenes Registrados
                    </h2>
                    <ExamTimeline exams={patient.exams} />
                </div>

                {/* Pulmonary Function History */}
                <div className="border-t border-zinc-100 pt-8">
                    <PulmonaryHistory patientId={patient.id} />
                </div>
            </div>
        </div>
    );
}
