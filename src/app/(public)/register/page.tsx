
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
                    <div className="mb-6">
                        <a href="/login" className="inline-flex items-center text-sm text-zinc-500 hover:text-indigo-600 transition-colors">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver al inicio
                        </a>
                    </div>
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

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="rutBody">
                                RUT
                            </label>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                                    id="rutBody"
                                    type="text"
                                    name="rutBody"
                                    placeholder="12345678"
                                    maxLength={8}
                                    pattern="\d*"
                                    title="Ingrese solo números"
                                    required
                                />
                                <span className="flex items-center text-zinc-400">-</span>
                                <input
                                    className="w-16 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200 text-center"
                                    id="rutDv"
                                    type="text"
                                    name="rutDv"
                                    placeholder="K"
                                    maxLength={1}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="region">
                                    Región
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200 bg-white"
                                        id="region"
                                        value={selectedRegion}
                                        onChange={(e) => {
                                            console.log('Region changed to:', e.target.value);
                                            setSelectedRegion(e.target.value);
                                        }}
                                        required
                                    >
                                        <option value="">Seleccionar Región</option>
                                        {REGIONS.map((r) => (
                                            <option key={r.name} value={r.name}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="commune">
                                    Comuna
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200 bg-white disabled:bg-zinc-50 disabled:text-zinc-400"
                                        id="commune"
                                        name="commune"
                                        required
                                    >
                                        <option value="">Seleccionar Comuna</option>
                                        {selectedRegion ? (
                                            REGIONS.find(r => r.name === selectedRegion)?.communes.map((c) => (
                                                <option key={c} value={c.toUpperCase()}>
                                                    {c}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="">Primero seleccione región</option>
                                        )}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                        </svg>
                                    </div>
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
                                autoComplete="off"
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
                                autoComplete="new-password"
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
