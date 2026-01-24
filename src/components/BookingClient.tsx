'use client'

import { useActionState, useState } from 'react'
import { bookAppointment } from '@/lib/actions.appointments'
import { logout } from '@/lib/actions.auth'
import BookingInterface from '@/components/BookingInterface'
import { LogOut, ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'

const initialState = {
    message: '',
}

interface BookingClientProps {
    userEmail?: string | null
    userName?: string | null
    isAdmin?: boolean
}

export default function BookingClient({ userEmail, userName, isAdmin }: BookingClientProps) {
    const [state, dispatch] = useActionState(bookAppointment, initialState)
    const [isPending, setIsPending] = useState(false)

    const handleConfirmBooking = async (date: Date) => {
        setIsPending(true)
        // Workaround: We will use a hidden form to submit the complex data from the UI
        const form = document.getElementById('booking-form') as HTMLFormElement
        if (form) {
            // Update hidden inputs
            const dateInput = document.getElementById('date-hidden') as HTMLInputElement
            if (dateInput) dateInput.value = date.toISOString()
            // Submit
            form.requestSubmit()
        }
    }

    // Effect to stop pending state when message changes (action completed)
    if (state.message && isPending) {
        setIsPending(false)
    }

    return (
        <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-100">
                {/* Header */}
                <div className="bg-white border-b border-zinc-100 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900">Agendar Hora</h1>
                        {state.message !== 'Success' && (
                            <p className="text-sm text-zinc-500 mt-1">Selecciona tu disponibilidad</p>
                        )}
                        {userName ? (
                            <div className="flex items-center mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit">
                                <User className="w-3 h-3 mr-1.5" />
                                Paciente: {userName}
                            </div>
                        ) : userEmail && (
                            <div className="flex items-center mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md w-fit">
                                <User className="w-3 h-3 mr-1.5" />
                                Paciente: {userEmail}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/portal"
                            className="flex items-center px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Link>

                        <form action={logout}>
                            <button
                                type="submit"
                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-full hover:bg-red-700 transition-all shadow-sm"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Cerrar Sesión
                            </button>
                        </form>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                    {state.message === 'Success' ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-2">¡Hora reservada exitosamente!</h2>
                            <p className="text-zinc-500 mb-6">Hemos enviado la confirmación a tu correo electrónico.</p>
                            <a href="/mis-reservas" className="text-indigo-600 font-medium hover:text-indigo-500">
                                Ver mis reservas
                            </a>
                        </div>
                    ) : (
                        <>
                            {/* Error Message */}
                            {state.message && state.message !== 'Success' && (
                                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex items-center">
                                    <span className="font-medium mr-1">Error:</span> {state.message}
                                </div>
                            )}

                            {/* Booking UI */}
                            <BookingInterface onConfirm={handleConfirmBooking} isPending={isPending} />

                            {/* Hidden Form for Server Action */}
                            <form id="booking-form" action={dispatch} className="hidden">
                                <input type="hidden" name="date" id="date-hidden" />
                                <input type="hidden" name="notes" value="Reserva Web" />
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
