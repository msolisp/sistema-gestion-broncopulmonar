
'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { registerPatient } from '@/lib/actions'
import { REGIONS } from '@/lib/chile-data'

const initialState = {
    message: '',
}

export default function RegisterPage() {
    const [state, dispatch] = useActionState(registerPatient, initialState)
    const [selectedRegion, setSelectedRegion] = useState('');

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl border border-zinc-100">
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-zinc-900 mb-2">Crear Cuenta</h1>
                    <p className="text-zinc-500 mb-8">Únete a nuestra plataforma de gestión</p>
                    <form action={dispatch} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="name">
                                Nombre Completo
                            </label>
                            <input
                                className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                id="name"
                                type="text"
                                name="name"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="rut">
                                    RUT
                                </label>
                                <input
                                    className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    id="rut"
                                    type="text"
                                    name="rut"
                                    placeholder="12.345.678-9"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="region">
                                        Región
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate"
                                        id="region"
                                        value={selectedRegion}
                                        onChange={(e) => {
                                            console.log('Region changed to:', e.target.value);
                                            setSelectedRegion(e.target.value);
                                        }}
                                        required
                                    >
                                        <option value="">Región</option>
                                        {REGIONS.map((r) => (
                                            <option key={r.name} value={r.name}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="commune">
                                        Comuna
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-zinc-100 disabled:text-zinc-400"
                                        id="commune"
                                        name="commune"
                                        required
                                    >
                                        <option value="">Comuna</option>
                                        {selectedRegion ? (
                                            REGIONS.find(r => r.name === selectedRegion)?.communes.map((c) => (
                                                <option key={c} value={c.toUpperCase()}>
                                                    {c}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">Seleccione Región</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="email">
                                Email
                            </label>
                            <input
                                className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                id="email"
                                type="email"
                                name="email"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="password">
                                Contraseña
                            </label>
                            <input
                                className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                id="password"
                                type="password"
                                name="password"
                                required
                            />
                        </div>
                        {state.message && (
                            <div className={`flex items-center space-x-2 text-sm ${state.message === 'Success' ? 'text-green-500' : 'text-red-500'}`}>
                                <p>{state.message === 'Success' ? 'Cuenta creada exitosamente! Puedes iniciar sesión.' : state.message}</p>
                            </div>
                        )}
                        <RegisterButton />
                    </form>

                    <div className="mt-6 text-center text-sm text-zinc-500">
                        ¿Ya tienes cuenta?{' '}
                        <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                            Inicia Sesión
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

function RegisterButton() {
    const { pending } = useFormStatus()

    return (
        <button
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            aria-disabled={pending}
        >
            {pending ? 'Registrando...' : 'Registrarse'}
        </button>
    )
}
