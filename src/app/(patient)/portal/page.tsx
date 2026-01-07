'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getPatientDashboardData } from "@/actions/patient-dashboard";
import PatientAirQuality from "@/components/PatientAirQuality";
import { AQIData } from "@/lib/air-quality";

interface DashboardData {
    patient: { id: string; name: string; commune: string; region: string };
    nextAppointment: { date: Date; status: string; timeBlock: string } | null;
    aqiData: AQIData | null;
}

export default function PortalPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const userName = data?.patient?.name || session?.user?.name || "Paciente";

    useEffect(() => {
        let isMounted = true;
        async function fetchData() {
            try {
                const result = await getPatientDashboardData();
                if (isMounted) {
                    if (result.error) {
                        console.error("Dashboard error:", result.error);
                    } else {
                        setData(result as any);
                    }
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
                if (isMounted) setLoading(false);
            }
        }
        fetchData();
        return () => { isMounted = false; };
    }, []);

    // Loading Skeleton
    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <header>
                    <div className="h-8 w-64 bg-zinc-200 rounded mb-2"></div>
                    <div className="h-4 w-96 bg-zinc-200 rounded"></div>
                </header>
                <div className="h-32 w-full bg-zinc-200 rounded-xl"></div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="h-48 bg-zinc-200 rounded-xl"></div>
                    <div className="h-48 bg-zinc-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    const nextAppointment = data?.nextAppointment;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-zinc-900">Bienvenido, {userName}</h1>
                <p className="text-zinc-500">Aquí tienes un resumen de tu actividad.</p>
            </header>

            {/* Air Quality Widget (Restored & Real) */}
            {data?.patient?.commune && (
                <PatientAirQuality
                    commune={data.patient.commune}
                    aqiData={data.aqiData}
                />
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Next Appointment Card */}
                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden text-zinc-950">
                    <div className="flex flex-col space-y-1.5 p-6 pb-2">
                        <div className="flex flex-row items-center justify-between">
                            <h3 className="text-sm font-medium leading-none tracking-tight">Próxima Atención</h3>
                            <div className="h-4 w-4 bg-indigo-600 rounded-full" />
                        </div>
                    </div>
                    <div className="p-6 pt-0">
                        {nextAppointment ? (
                            <div className="space-y-1">
                                <div className="text-2xl font-bold">
                                    {new Date(nextAppointment.date).toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
                                </div>
                                <p className="text-xs text-zinc-500">
                                    {new Date(nextAppointment.date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs
                                </p>
                            </div>
                        ) : (
                            <div className="text-sm text-zinc-500 py-2">
                                No tienes citas agendadas proximamente.
                            </div>
                        )}
                        <Link href="/portal/citas" prefetch={false} className="text-xs text-indigo-600 hover:underline mt-4 block">
                            Ver todas mis citas
                        </Link>
                    </div>
                </div>

                {/* History Quick Access */}
                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden text-zinc-950">
                    <div className="flex flex-col space-y-1.5 p-6 pb-2">
                        <div className="flex flex-row items-center justify-between">
                            <h3 className="text-sm font-medium leading-none tracking-tight">Historial Médico</h3>
                            <div className="h-4 w-4 bg-green-600 rounded-full" />
                        </div>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-sm text-zinc-500 py-2">
                            Revisa el progreso de tus exámenes y evaluación pulmonar.
                        </div>
                        <Link href="/portal/historial" prefetch={false} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-indigo-600 text-white shadow hover:bg-indigo/90 h-9 px-4 py-2 w-full mt-2">
                            Ver Historial
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
