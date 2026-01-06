'use server';

import { getPulmonaryHistory } from '@/lib/pulmonary';
import { PulmonaryChart } from './PulmonaryChart';
import { PulmonaryHistoryTable } from './PulmonaryHistoryTable';
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
            <PulmonaryHistoryTable history={history} />
        </div>
    );
}
