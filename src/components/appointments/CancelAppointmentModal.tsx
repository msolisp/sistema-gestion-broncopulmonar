'use client';

import { useState } from 'react';
import { cancelAppointment } from '@/actions/appointments';
import { X, AlertTriangle } from 'lucide-react';

export default function CancelAppointmentModal({ appointmentId }: { appointmentId: string }) {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleCancel() {
        if (!reason.trim()) {
            setError('Por favor indica un motivo.');
            return;
        }

        setLoading(true);
        setError('');

        const result = await cancelAppointment(appointmentId, reason);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setLoading(false);
            setOpen(false);
            setReason('');
            // Optional: Toast or refresh logic is handled by server action revalidation
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
            >
                Cancelar
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md rounded-xl bg-white shadow-lg animate-in zoom-in-95 duration-200 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Cancelar Reserva
                            </h3>
                            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-900">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-sm text-zinc-600">
                            ¿Estás seguro que deseas cancelar esta hora? Esta acción no se puede deshacer.
                            Por favor déjanos un motivo para liberar el cupo.
                        </p>

                        <div className="space-y-2">
                            <label htmlFor="reason" className="block text-sm font-medium text-zinc-700">Motivo de cancelación</label>
                            <textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                                placeholder="Ej: No podré asistir por trabajo..."
                                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-red-500 focus:ring-red-500"
                            />
                            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setOpen(false)}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50"
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
