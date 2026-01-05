'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { changePassword } from '@/lib/actions';
import { useRouter } from 'next/navigation';

const initialState = {
    message: '',
};

export default function ChangePasswordPage() {
    const [state, dispatch] = useActionState(async (prev: any, formData: FormData) => {
        const result = await changePassword(formData);
        if (result.message === 'Success') {
            // Redirect handled here or via effect?
            // Since it's a server action, better to handle redirect on client if we want force reload or just use router.
            // But valid way is to let the action success and client redirects.
            window.location.href = '/dashboard'; // Force reload/redirect
            return { message: 'Success' };
        }
        return result;
    }, initialState);

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-zinc-100">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-zinc-900">Cambio de Contraseña Obligatorio</h1>
                    <p className="text-zinc-500 mt-2">Por seguridad, debes cambiar tu contraseña antes de continuar.</p>
                </div>

                <form action={dispatch} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                            Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            required
                            minLength={6}
                            className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    {state.message && state.message !== 'Success' && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                            {state.message}
                        </div>
                    )}

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
