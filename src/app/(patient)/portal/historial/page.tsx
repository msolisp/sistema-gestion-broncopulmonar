'use client';

import { useEffect, useState } from "react";
import { PulmonaryChart } from "@/components/PulmonaryChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { getPatientHistory } from "@/actions/patient-history";

export default function MyHistoryPage() {
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const result = await getPatientHistory();
                if (result.error) {
                    setError(result.error);
                } else if (result.tests) {
                    setTests(result.tests);
                }
            } catch (err) {
                setError("Ocurrió un error al cargar los datos.");
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-zinc-900">Mi Historial Médico</h1>
                <p className="text-zinc-500">Evolución de sus pruebas de función pulmonar.</p>
            </div>

            {tests.length > 0 ? (
                <div className="grid gap-6">
                    <PulmonaryChart data={tests} />

                    <Card className="shadow-md">
                        <CardHeader>
                            <CardTitle>Historial de Exámenes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-zinc-50 text-zinc-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Fecha</th>
                                            <th className="px-4 py-3">CVF %</th>
                                            <th className="px-4 py-3">VEF1 %</th>
                                            <th className="px-4 py-3">DLCO %</th>
                                            <th className="px-4 py-3">Caminata 6M</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {tests.map(test => (
                                            <tr key={test.id} className="hover:bg-zinc-50">
                                                <td className="px-4 py-3 font-medium">
                                                    {new Date(test.date).toLocaleDateString('es-CL')}
                                                </td>
                                                <td className="px-4 py-3">{test.cvfPercent || '-'}%</td>
                                                <td className="px-4 py-3">{test.vef1Percent || '-'}%</td>
                                                <td className="px-4 py-3">{test.dlcoPercent || '-'}%</td>
                                                <td className="px-4 py-3">{test.walkDistance ? test.walkDistance + ' m' : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-zinc-200 text-center shadow-md">
                    <div className="p-4 bg-zinc-50 rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h3 className="text-lg font-medium text-zinc-900">No hay datos registrados</h3>
                    <p className="text-zinc-500 mt-1 max-w-sm">
                        Aún no se han registrado pruebas de función pulmonar en su ficha clínica.
                    </p>
                </div>
            )}
        </div>
    );
}
