'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PulmonaryRecord {
    id: string;
    date: Date;
    walkDistance: number | null;
    cvfPercent: number | null;
    dlcoPercent: number | null;
}

export function PulmonaryChart({ data }: { data: any[] }) {
    // Format dates for chart
    const chartData = data.map(d => ({
        ...d,
        formattedDate: format(new Date(d.date), 'dd MMM yy', { locale: es }),
    }));

    return (
        <div className="h-[400px] w-full bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-800 mb-4">Tendencia de Función Pulmonar</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="formattedDate" />
                    <YAxis />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />

                    {/* TM6M - Distancia (Metros) - Usa eje izquierdo pero escala distinta, quizas deberia normalizar o usar eje derecho? 
                        Dado que los otros son %, y esto es metros (300-600), mejor usar eje derecho 
                    */}
                    <YAxis yAxisId="right" orientation="right" />

                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="walkDistance"
                        name="Distancia TM6M (m)"
                        stroke="#10b981" // Emerald
                        strokeWidth={2}
                        connectNulls
                    />
                    <Line
                        type="monotone"
                        dataKey="cvfPercent"
                        name="CVF %"
                        stroke="#3b82f6" // Blue
                        strokeWidth={2}
                        connectNulls
                    />
                    <Line
                        type="monotone"
                        dataKey="dlcoPercent"
                        name="DLCO %"
                        stroke="#ef4444" // Red
                        strokeWidth={2}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
