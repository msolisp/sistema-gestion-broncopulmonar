
'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticate } from '@/lib/actions'

export default function LoginPage() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined)

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl border border-zinc-100">
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-zinc-900 mb-2">Bienvenido</h1>
                    <p className="text-zinc-500 mb-8">Ingresa a tu cuenta para continuar</p>
                    <form action={dispatch} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1" htmlFor="email">
                                Email
                            </label>
                            <input
                                className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="m@example.com"
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
                                autoComplete="off"
                                required
                            />
                        </div>
                        {errorMessage && (
                            <div className="flex items-center space-x-2 text-sm text-red-500">
                                <p>{errorMessage}</p>
                            </div>
                        )}
                        <LoginButton />
                    </form>

                    <div className="mt-6 text-center text-sm text-zinc-500">
                        ¿No tienes cuenta?{' '}
                        <a href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
                            Regístrate
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

function LoginButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            aria-disabled={pending}
        >
            {pending ? 'Ingresando...' : 'Ingresar'}
        </button>
    )
}
