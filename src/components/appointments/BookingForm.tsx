'use client'

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { bookAppointment } from "@/actions/appointments"
import Link from "next/link"

const TIME_SLOTS_AM = [
    "09:00", "10:00", "11:00", "12:00"
]

const TIME_SLOTS_PM = [
    "14:00", "15:00", "16:00", "17:00"
]

const initialState = {
    message: '',
    error: ''
}

export default function BookingForm() {
    const [state, dispatch] = useActionState(bookAppointment, initialState)

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Nueva Reserva</h2>
            {state.message === 'Success' ? (
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-zinc-900 mb-2">¡Reserva Confirmada!</h2>
                    <p className="text-zinc-500 mb-6">Tu hora ha sido agendada exitosamente.</p>
                    <button onClick={() => window.location.reload()} className="text-indigo-600 hover:underline">
                        Realizar otra reserva
                    </button>
                </div>
            ) : (
                <form action={dispatch} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                            Fecha
                        </label>
                        <input
                            type="date"
                            name="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full rounded-lg border border-zinc-200 px-4 py-2 text-zinc-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bloque AM</span>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {TIME_SLOTS_AM.map((time) => (
                                    <label key={time} className="relative cursor-pointer">
                                        <input
                                            type="radio"
                                            name="timeBlock"
                                            value={time}
                                            required
                                            className="peer sr-only"
                                        />
                                        <div className="text-center py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 transition-all">
                                            {time}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Bloque PM</span>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {TIME_SLOTS_PM.map((time) => (
                                    <label key={time} className="relative cursor-pointer">
                                        <input
                                            type="radio"
                                            name="timeBlock"
                                            value={time}
                                            required
                                            className="peer sr-only"
                                        />
                                        <div className="text-center py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 transition-all">
                                            {time}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {state.error && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                            {state.error}
                        </div>
                    )}

                    <SubmitButton />
                </form>
            )}
        </div>
    )
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
            {pending ? 'Enviando solicitud...' : 'Confirmar Reserva'}
        </button>
    )
}
