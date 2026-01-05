
import { getMyAppointments } from '@/actions/appointments';
import BookingForm from '@/components/appointments/BookingForm';
import Link from 'next/link';

export default async function AppointmentsPage() {
    const appointments = await getMyAppointments();

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Mis Citas</h1>
                    <p className="text-zinc-500">Gestiona tus horas médicas</p>
                </div>
                <Link href="/portal" className="text-sm text-indigo-600 hover:underline">
                    Volver al inicio
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Formulario de Reserva */}
                <div>
                    <BookingForm />
                </div>

                {/* Lista de Citas */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-zinc-900">Historial de Reservas</h2>
                    {appointments.length === 0 ? (
                        <div className="p-8 text-center bg-zinc-50 rounded-xl border border-zinc-100 text-zinc-500">
                            No tienes citas registradas.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {appointments.map((apt) => (
                                <div key={apt.id} className="p-4 bg-white border border-zinc-200 rounded-xl shadow-sm flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-zinc-900">
                                            {new Date(apt.date).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                        <div className="text-sm text-zinc-500">
                                            {new Date(apt.date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs
                                        </div>
                                    </div>
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                                apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {apt.status === 'PENDING' ? 'Pendiente' :
                                                apt.status === 'CONFIRMED' ? 'Confirmada' : 'Cancelada'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
