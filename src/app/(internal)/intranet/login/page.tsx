'use client'

import { Suspense, useEffect, useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticate } from '@/lib/actions'
import { Monitor } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

// This component will contain the logic that uses useSearchParams
function LoginContent() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined)
    const searchParams = useSearchParams()
    const [successMessage, setSuccessMessage] = useState('')

    useEffect(() => {
        if (searchParams.get('passwordChanged') === 'true') {
            setSuccessMessage('Contraseña cambiada exitosamente. Por favor, inicia sesión nuevamente.')
        }
    }, [searchParams])

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200">
                <div className="bg-slate-800 p-6 text-center border-b border-slate-700">
                    <div className="mx-auto w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center mb-3">
                        <Monitor className="w-6 h-6 text-blue-400" />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-wide">Acceso Funcionario</h1>
                    <p className="text-slate-400 text-xs uppercase tracking-wider mt-1">Portal Interno</p>
                </div>

                <div className="p-8">
                    <form action={dispatch} className="space-y-4">
                        <input type="hidden" name="portal_type" value="internal" />
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1" htmlFor="email">
                                Credencial (Email)
                            </label>
                            <input
                                className="w-full rounded bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="usuario@hospital.cl"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1" htmlFor="password">
                                Contraseña
                            </label>
                            <input
                                className="w-full rounded bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                id="password"
                                type="password"
                                name="password"
                                required
                            />
                        </div>
                        {successMessage && (
                            <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded border border-green-100">
                                <p>{successMessage}</p>
                            </div>
                        )}
                        {errorMessage && (
                            <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded border border-red-100">
                                <p>{errorMessage}</p>
                            </div>
                        )}
                        <LoginButton />
                    </form>

                    <div className="mt-8 text-center border-t border-slate-100 pt-4">
                        <p className="text-xs text-slate-500">
                            Acceso restringido. Su IP está siendo registrada.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function InternalLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
            <LoginContent />
        </Suspense>
    )
}

function LoginButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 uppercase tracking-wide shadow-lg shadow-blue-500/30"
            aria-disabled={pending}
        >
            {pending ? 'Verificando...' : 'Iniciar Sesión Segura'}
        </button>
    )
}
