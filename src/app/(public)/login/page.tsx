
'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { authenticate } from '@/lib/actions'
import TurnstileCaptcha from '@/components/TurnstileCaptcha'
import VisualCaptcha from '@/components/VisualCaptcha'

export default function LoginPage() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined)
    const [captchaToken, setCaptchaToken] = useState<string>('')
    const [visualCaptchaValue, setVisualCaptchaValue] = useState<string>('')
    const [visualCaptchaToken, setVisualCaptchaToken] = useState<string>('')

    const handleVisualCaptchaChange = (value: string, token: string) => {
        setVisualCaptchaValue(value);
        setVisualCaptchaToken(token);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl border border-zinc-100">
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-zinc-900 mb-2">Bienvenido</h1>
                    <p className="text-zinc-500 mb-8">Ingresa a tu cuenta para continuar</p>
                    <form action={dispatch} className="space-y-4">
                        <input type="hidden" name="cf-turnstile-response" value={captchaToken} />
                        <input type="hidden" name="visual-captcha-value" value={visualCaptchaValue} />
                        <input type="hidden" name="visual-captcha-token" value={visualCaptchaToken} />

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2" htmlFor="email">
                                Email
                            </label>
                            <input
                                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                id="email"
                                type="email"
                                name="email"
                                placeholder="m@example.com"
                                autoComplete="off"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2" htmlFor="password">
                                Contraseña
                            </label>
                            <input
                                className="w-full rounded-lg border border-zinc-200 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                id="password"
                                type="password"
                                name="password"
                                autoComplete="off"
                                required
                            />
                        </div>

                        <VisualCaptcha onCaptchaChange={handleVisualCaptchaChange} />

                        <TurnstileCaptcha onVerify={(token) => setCaptchaToken(token)} />

                        {errorMessage && (
                            <div className="flex items-center space-x-2 text-sm text-red-500">
                                <p>{errorMessage}</p>
                            </div>
                        )}
                        <LoginButton disabled={(!captchaToken || !visualCaptchaValue) && process.env.NODE_ENV === 'production'} />
                    </form>

                    <div className="mt-6 text-center text-sm text-zinc-500">
                        ¿No tienes cuenta?{' '}
                        <a href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                            Regístrate
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

function LoginButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus()
    const isDisabled = pending || disabled

    return (
        <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-disabled={isDisabled}
            disabled={isDisabled}
        >
            {pending ? 'Ingresando...' : 'Ingresar'}
        </button>
    )
}
