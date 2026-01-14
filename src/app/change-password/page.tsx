'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { changePassword } from '@/lib/actions';
import { Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordPage() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-zinc-100">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-zinc-900">Cambio de Contraseña Obligatorio</h1>
                    <p className="text-zinc-500 mt-2">Por seguridad, debes cambiar tu contraseña antes de continuar.</p>
                </div>

                <form action={changePassword} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                            Nueva Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="newPassword"
                                required
                                minLength={6}
                                className="w-full rounded-lg border border-zinc-200 px-4 py-2 pr-10 text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                placeholder="Mínimo 6 caracteres"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <SubmitButton />
                </form>
            </div>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
            {pending ? 'Actualizando...' : 'Cambiar Contraseña'}
        </button>
    );
}
