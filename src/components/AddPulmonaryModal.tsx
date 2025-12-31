'use client';

import { useState } from 'react';
import { PlusCircle, Activity, Wind, Waves, X } from 'lucide-react';
import { addPulmonaryRecord } from '@/lib/pulmonary';

export function AddPulmonaryModal({ patientId }: { patientId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        formData.append('patientId', patientId);

        await addPulmonaryRecord(formData);

        setLoading(false);
        setOpen(false);
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
                <PlusCircle className="h-4 w-4" />
                Nuevo Registro
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-lg animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-lg font-bold text-zinc-900">Registrar Función Pulmonar</h2>
                            <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-900">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto p-6">
                            <form id="pulmonary-form" onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="date" className="block text-sm font-medium text-zinc-700">Fecha del Examen</label>
                                        <input
                                            id="date"
                                            name="date"
                                            type="date"
                                            required
                                            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* TM6M Selection */}
                                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Activity className="h-5 w-5 text-emerald-600" />
                                        <h3 className="font-semibold text-emerald-900">Test de Marcha (TM6M)</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-emerald-800">Distancia (m)</label>
                                            <input name="walkDistance" type="number" step="0.1" placeholder="ej. 350" className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-emerald-800">SpO2 Basal (%)</label>
                                            <input name="spo2Rest" type="number" placeholder="94" className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-emerald-800">SpO2 Final (%)</label>
                                            <input name="spo2Final" type="number" placeholder="88" className="w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* Spirometry */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Wind className="h-5 w-5 text-blue-600" />
                                        <h3 className="font-semibold text-blue-900">Espirometría</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-blue-800">CVF (% Teórico)</label>
                                            <input name="cvfPercent" type="number" placeholder="ej. 78" className="w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-blue-800">VEF1 (% Teórico)</label>
                                            <input name="vef1Percent" type="number" placeholder="ej. 65" className="w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-blue-800">CVF (Litros)</label>
                                            <input name="cvfValue" type="number" step="0.01" placeholder="ej. 2.34" className="w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-blue-800">VEF1 (Litros)</label>
                                            <input name="vef1Value" type="number" step="0.01" placeholder="ej. 1.85" className="w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                </div>

                                {/* DLCO */}
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Waves className="h-5 w-5 text-orange-600" />
                                        <h3 className="font-semibold text-orange-900">Difusión (DLCO)</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-orange-800">DLCO (% del predicho)</label>
                                            <input name="dlcoPercent" type="number" placeholder="ej. 56" className="w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">Notas / Comentarios</label>
                                    <textarea
                                        id="notes"
                                        name="notes"
                                        rows={3}
                                        placeholder="ej. P 42 mmHg, desaturación importante."
                                        className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 border-t px-6 py-4 bg-zinc-50 rounded-b-xl">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="inline-flex justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="pulmonary-form"
                                disabled={loading}
                                className="inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {loading ? 'Guardando...' : 'Guardar Registro'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
