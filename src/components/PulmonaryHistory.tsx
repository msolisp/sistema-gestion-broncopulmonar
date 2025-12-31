'use server';

import { getPulmonaryHistory } from '@/lib/pulmonary';
import { PulmonaryChart } from './PulmonaryChart';
import { AddPulmonaryModal } from './AddPulmonaryModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function PulmonaryHistory({ patientId }: { patientId: string }) {
    const history = await getPulmonaryHistory(patientId);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900">Historial Función Pulmonar</h2>
                    <p className="text-zinc-500">Seguimiento longitudinal de TM6M, Espirometría y DLCO.</p>
                </div>
                <AddPulmonaryModal patientId={patientId} />
            </div>

            {/* Charts Section */}
            {history.length > 0 ? (
                <PulmonaryChart data={history} />
            ) : (
                <div className="p-8 text-center border-2 border-dashed border-zinc-200 rounded-xl">
                    <p className="text-zinc-500">No hay registros históricos aún. Agrega el primero.</p>
                </div>
            )}

            {/* Detailed Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-100">
                    <h3 className="text-lg font-bold text-zinc-900">Registros Detallados</h3>
                    <p className="text-sm text-zinc-500">Evolución tabular de los exámenes ingresados.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 text-zinc-700 font-medium">
                            <tr>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3 text-emerald-700">TM6M (m)</th>
                                <th className="px-6 py-3 text-emerald-700">SpO2 (In/Fin)</th>
                                <th className="px-6 py-3 text-blue-700">CVF %</th>
                                <th className="px-6 py-3 text-blue-700">VEF1 %</th>
                                <th className="px-6 py-3 text-orange-700">DLCO %</th>
                                <th className="px-6 py-3">Notas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {[...history].reverse().map((record) => (
                                <tr key={record.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4 font-medium">
                                        {format(record.date, 'dd MMM yyyy', { locale: es })}
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.walkDistance ? `${record.walkDistance} m` : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.spo2Rest && record.spo2Final
                                            ? `${record.spo2Rest}% -> ${record.spo2Final}%`
                                            : '-'
                                        }
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.cvfPercent ? `${record.cvfPercent}%` : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {record.vef1Percent ? `${record.vef1Percent}%` : '-'}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-orange-600">
                                        {record.dlcoPercent ? `${record.dlcoPercent}%` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 max-w-[200px] truncate" title={record.notes || ''}>
                                        {record.notes || '-'}
                                    </td>
                                </tr>
                            ))}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                                        Sin datos registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
