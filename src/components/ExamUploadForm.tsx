'use client';

import { useState, useEffect } from 'react';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadMedicalExam } from '@/lib/actions.patients';
import { useRouter } from 'next/navigation';

export default function ExamUploadForm({ patientId }: { patientId: string }) {
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        centerName: '',
        doctorName: '',
        examDate: new Date().toISOString().split('T')[0]
    });
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string | null }>({
        type: null,
        message: null
    });
    const router = useRouter();

    // Auto-clear success message after 5 seconds
    useEffect(() => {
        if (status.type === 'success') {
            const timer = setTimeout(() => {
                setStatus({ type: null, message: null });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const [maxSizeMB, setMaxSizeMB] = useState(1);

    useEffect(() => {
        import('@/lib/actions.system').then(({ getSystemConfig }) => {
            getSystemConfig('MAX_FILE_SIZE_MB').then(val => {
                if (val) setMaxSizeMB(parseInt(val, 10));
            });
        });
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const form = e.currentTarget;
        const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
        const file = fileInput?.files?.[0];
        const MAX_SIZE = maxSizeMB * 1024 * 1024;

        if (file && file.size > MAX_SIZE) {
            alert(`El archivo excede el límite de ${maxSizeMB}MB`);
            return;
        }

        setIsUploading(true);
        const data = new FormData();
        if (file) data.append('file', file);
        data.append('centerName', formData.centerName);
        data.append('doctorName', formData.doctorName);
        data.append('examDate', formData.examDate);
        data.append('patientId', patientId);

        const res = await uploadMedicalExam(data);

        setIsUploading(false);
        if (res?.message) {
            setStatus({ type: 'error', message: res.message });
        } else if (res?.success) {
            setStatus({ type: 'success', message: '¡Examen subido exitosamente!' });
            router.refresh();
            // Reset form
            setFormData({
                centerName: '',
                doctorName: '',
                examDate: new Date().toISOString().split('T')[0]
            });
            if (fileInput) fileInput.value = '';
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
                <form id="upload-form" onSubmit={handleSubmit} className="space-y-4">

                    <div className="flex flex-col md:flex-row gap-4">
                        {/* File Input - Takes up 40% */}
                        <div className="w-full md:w-5/12">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                Archivo PDF <span className="text-red-500 lowercase font-normal">(Máximo {maxSizeMB}MB)</span>
                                <input
                                    type="file"
                                    name="file"
                                    accept="application/pdf"
                                    required
                                    className="mt-1 block w-full text-xs text-zinc-500
                                  file:mr-2 file:py-2 file:px-3
                                  file:rounded-full file:border-0
                                  file:text-xs file:font-bold
                                  file:bg-indigo-50 file:text-indigo-700
                                  hover:file:bg-indigo-100
                                  border border-dashed border-zinc-300 rounded-lg cursor-pointer p-2
                                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                                "
                                />
                            </label>
                        </div>

                        {/* Metadata Inputs - Takes up 60% */}
                        <div className="w-full md:w-7/12 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                    Centro Médico
                                    <input
                                        type="text"
                                        name="centerName"
                                        value={formData.centerName}
                                        onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                                        required
                                        placeholder="Ej: Clínica..."
                                        className="mt-1 w-full rounded-md border-zinc-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs text-zinc-900 p-2 h-[38px]"
                                    />
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                    Médico
                                    <input
                                        type="text"
                                        name="doctorName"
                                        value={formData.doctorName}
                                        onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                                        required
                                        placeholder="Ej: Dr. Pérez"
                                        className="mt-1 w-full rounded-md border-zinc-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs text-zinc-900 p-2 h-[38px]"
                                    />
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">
                                    Fecha
                                    <input
                                        type="date"
                                        name="examDate"
                                        value={formData.examDate}
                                        onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                                        required
                                        className="mt-1 w-full rounded-md border-zinc-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs text-zinc-900 p-2 h-[38px]"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col items-end gap-3">
                        {status.message && (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${status.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {status.type === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                {status.message}
                            </div>
                        )}
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
