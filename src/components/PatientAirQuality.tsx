import { Cloud, CheckCircle, AlertTriangle, AlertOctagon } from "lucide-react";
import { AQIData } from "@/lib/air-quality";

interface PatientAirQualityProps {
    commune: string;
    aqiData: AQIData | null;
}

export default function PatientAirQuality({ commune, aqiData }: PatientAirQualityProps) {
    if (!aqiData) return null;

    const { level, value, color } = aqiData;

    // Icon logic
    let Icon = CheckCircle;
    if (level === 'Regular') Icon = Cloud;
    if (level === 'Alerta' || level === 'Preemergencia') Icon = AlertTriangle;
    if (level === 'Emergencia') Icon = AlertOctagon;

    return (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-md overflow-hidden">
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-1">
                                Calidad del Aire en {commune}
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full text-white font-bold text-sm shadow-sm" style={{ backgroundColor: color }}>
                                    <Icon className="w-4 h-4" />
                                    {level}
                                </div>
                                <span className="text-2xl font-bold text-zinc-900">{value} AQI</span>
                            </div>
                        </div>

                        <p className="text-sm text-zinc-600 bg-zinc-50 px-4 py-2 rounded-lg border border-zinc-100 italic">
                            {level === 'Bueno' && "El aire es seguro para realizar actividades al aire libre."}
                            {level === 'Regular' && "Calidad aceptable. Personas muy sensibles deberían considerar reducir esfuerzos."}
                            {(level === 'Alerta' || level === 'Preemergencia') && "Evita realizar ejercicio físico intenso al aire libre."}
                            {level === 'Emergencia' && "Peligroso. Evita toda actividad física al aire libre."}
                        </p>
                    </div>

                    <p className="text-xs text-zinc-400">
                        Estación de monitoreo: {aqiData.originalName}
                    </p>
                </div>
            </div>
        </div>
    );
}
