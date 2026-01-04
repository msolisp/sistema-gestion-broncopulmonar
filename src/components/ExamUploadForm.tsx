'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { uploadMedicalExam } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export default function ExamUploadForm({ patientId }: { patientId: string }) {
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsUploading(true);
        formData.append('patientId', patientId);

        const res = await uploadMedicalExam(formData);

        setIsUploading(false);
        if (res?.message) {
            alert(res.message);
        } else if (res?.success) {
            alert('Examen subido correctamente');
            router.refresh();
            // Reset form? Usually requires ref or Controlled inputs.
            // basic reset via DOM for now or let page refresh handle it if we redirect?
            // Actually router.refresh() keeps state, so standard form reset is needed.
            (document.getElementById('upload-form') as HTMLFormElement)?.reset();
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-zinc-100 overflow-hidden">
            <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Subir Nuevo Examen
                </h3>
            </div>

            <div className="p-4">
                <form id="upload-form" action={handleSubmit} className="space-y-4">

                    <div className="flex flex-col md:flex-row gap-4">
                        {/* File Input - Takes up 40% */}
                        <div className="w-full md:w-5/12">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                Archivo PDF
                            </label>
                            <input
                                type="file"
                                name="file"
                                accept="application/pdf"
                                required
                                className="block w-full text-xs text-zinc-500
                                  file:mr-2 file:py-2 file:px-3
                                  file:rounded-full file:border-0
                                  file:text-xs file:font-bold
                                  file:bg-indigo-50 file:text-indigo-700
                                  hover:file:bg-indigo-100
                                  border border-dashed border-zinc-300 rounded-lg cursor-pointer p-2
                                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                "
                            />
                        </div>

                        {/* Metadata Inputs - Takes up 60% */}
                        <div className="w-full md:w-7/12 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                    Centro Médico
                                </label>
                                <input
                                    type="text"
                                    name="centerName"
                                    required
                                    placeholder="Ej: Clínica..."
                                    className="w-full rounded-md border-zinc-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs text-zinc-900 p-2 h-[38px]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                    Médico
                                </label>
                                <input
                                    type="text"
                                    name="doctorName"
                                    required
                                    placeholder="Ej: Dr. Pérez"
                                    className="w-full rounded-md border-zinc-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs text-zinc-900 p-2 h-[38px]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                    Fecha
                                </label>
                                <input
                                    type="date"
                                    name="examDate"
                                    required
                                    className="w-full rounded-md border-zinc-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs text-zinc-900 p-2 h-[38px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-1 flex justify-end">
                        <button
                            type="submit"
                            disabled={isUploading}
                            className={`flex justify-center items-center py-2 px-6 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white transition-all transform hover:scale-[1.02]
                                ${isUploading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}
                            `}
                        >
                            {isUploading ? '...' : 'Guardar y Subir'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
