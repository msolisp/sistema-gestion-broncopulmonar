'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, Settings, Shield } from 'lucide-react';
import { getSystemConfig, updateSystemConfig } from '@/lib/actions.system';

export default function SystemConfigManager() {
    const [maxSize, setMaxSize] = useState('1');
    const [turnstileEnabled, setTurnstileEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string | null }>({
        type: null,
        message: null
    });

    useEffect(() => {
        loadConfig();
    }, []);

    // Auto-clear message
    useEffect(() => {
        if (status.message) {
            const timer = setTimeout(() => {
                setStatus({ type: null, message: null });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const loadConfig = async () => {
        setIsLoading(true);
        const [sizeVal, turnstileVal] = await Promise.all([
            getSystemConfig('MAX_FILE_SIZE_MB'),
            getSystemConfig('TURNSTILE_ENABLED')
        ]);

        if (sizeVal) setMaxSize(sizeVal);
        setTurnstileEnabled(turnstileVal !== 'false');
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const results = await Promise.all([
            updateSystemConfig('MAX_FILE_SIZE_MB', maxSize),
            updateSystemConfig('TURNSTILE_ENABLED', turnstileEnabled ? 'true' : 'false')
        ]);

        if (results.every(r => r.success)) {
            setStatus({ type: 'success', message: 'Configuración actualizada correctamente' });
        } else {
            setStatus({ type: 'error', message: 'Error al guardar algunos parámetros' });
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-zinc-500">Cargando configuración...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Settings className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-900">Configuración subida de archivos</h2>
                    <p className="text-sm text-zinc-500">Parámetros globales de la aplicación</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                            <Shield className="w-4 h-4 text-indigo-600" />
                            Seguridad y Accesibilidad
                        </h3>
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-zinc-700">Cloudflare Turnstile</label>
                                <p className="text-xs text-zinc-500">
                                    Habilita la verificación de "No soy un robot" en el login.
                                    <span className="block text-amber-600 font-medium mt-1">Desactívalo solo en emergencias si el servicio falla.</span>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTurnstileEnabled(!turnstileEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ${turnstileEnabled ? 'bg-indigo-600 ring-indigo-500' : 'bg-zinc-300 ring-transparent'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${turnstileEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                            <Settings className="w-4 h-4 text-indigo-600" />
                            Gestión de Archivos
                        </h3>
                        <div>
                            <label htmlFor="maxSize" className="block text-sm font-semibold text-zinc-700 mb-2">
                                Límite de Tamaño de Archivos (MB)
                            </label>
                            <p className="text-xs text-zinc-500 mb-3">
                                Este valor define el tamaño máximo permitido para la subida de exámenes médicos y otros documentos.
                            </p>
                            <div className="relative max-w-xs">
                                <input
                                    type="number"
                                    id="maxSize"
                                    min="1"
                                    max="50"
                                    value={maxSize}
                                    onChange={(e) => setMaxSize(e.target.value)}
                                    className="block w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-medium">
                                    MB
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-50 flex items-center justify-between">
                        <div className="h-8">
                            {status.message && (
                                <div className={`flex items-center gap-2 text-sm font-medium ${status.type === 'success' ? 'text-green-600' : 'text-red-600'
                                    } animate-in fade-in slide-in-from-left-2`}>
                                    {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {status.message}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md ${isSaving ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
