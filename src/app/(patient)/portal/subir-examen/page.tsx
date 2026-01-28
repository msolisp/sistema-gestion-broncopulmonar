'use client';

import PatientExamsUpload from "@/components/PatientExamsUpload";
import PatientExamsList from "@/components/PatientExamsList";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPatientDashboardData } from "@/actions/patient-dashboard";
import { Loader2 } from "lucide-react";

export default function SubirExamenPage() {
    const router = useRouter();
    const [exams, setExams] = useState<any[]>([]);
    const [examsLoading, setExamsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    const fetchExams = async () => {
        setExamsLoading(true);
        try {
            const { getPatientExams } = await import("@/lib/patient-actions");
            const data = await getPatientExams();
            setExams(data);
        } catch (error) {
            console.error("Error fetching exams", error);
        } finally {
            setExamsLoading(false);
        }
    };

    useEffect(() => {
        async function checkPermission() {
            try {
                const data = await getPatientDashboardData();
                if (data.permissions && data.permissions.includes('Subir Examenes')) {
                    setAuthorized(true);
                    fetchExams();
                } else {
                    router.push('/portal');
                }
            } catch (error) {
                console.error("Error checking permissions", error);
                router.push('/portal');
            } finally {
                setLoading(false);
            }
        }
        checkPermission();
    }, [router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!authorized) return null;

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-zinc-900">Subir Examen Médico</h1>
                <p className="text-zinc-500">Sube tus documentos médicos para que sean revisados por el equipo clínico.</p>
            </header>

            <PatientExamsUpload onSuccess={() => {
                fetchExams();
                // We no longer redirect to history automatically, allowing multiple uploads
            }} />

            <div className="pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-zinc-900">Mis Archivos Cargados</h2>
                    {examsLoading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
                </div>

                <PatientExamsList
                    exams={exams}
                    onDelete={fetchExams}
                    onUpdate={fetchExams}
                />
            </div>
        </div>
    );
}
