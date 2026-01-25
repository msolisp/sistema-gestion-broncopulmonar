'use client';

import PatientExamsUpload from "@/components/PatientExamsUpload";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPatientDashboardData } from "@/actions/patient-dashboard";
import { Loader2 } from "lucide-react";

export default function SubirExamenPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        async function checkPermission() {
            try {
                const data = await getPatientDashboardData();
                if (data.permissions && data.permissions.includes('Subir Examenes')) {
                    setAuthorized(true);
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
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-zinc-900">Subir Examen Médico</h1>
                <p className="text-zinc-500">Sube tus documentos médicos para que sean revisados por el equipo clínico.</p>
            </header>

            <PatientExamsUpload onSuccess={() => {
                router.push('/portal/historial');
            }} />
        </div>
    );
}
