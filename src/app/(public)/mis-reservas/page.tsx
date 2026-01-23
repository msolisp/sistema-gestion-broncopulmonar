import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, FileText } from 'lucide-react';
import Link from 'next/link';

export default async function MyReservationsPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login?callbackUrl=/mis-reservas');
    }

    // Query FichaClinica via Persona email
    const ficha = await prisma.fichaClinica.findFirst({
        where: {
            persona: {
                email: session.user.email
            }
        },
        include: {
            citas: {
                orderBy: { fecha: 'desc' }
            }
        }
    });

    if (!ficha) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
                <div className="bg-white p-8 rounded-xl shadow-md border border-zinc-100 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-2">Perfil no encontrado</h1>
                    <p className="text-zinc-600 mb-6">No pudimos encontrar tu ficha clínica.</p>
                    <Link href="/" className="text-indigo-600 hover:underline">Volver al inicio</Link>
                </div>
            </div>
        );
    }

    const appointments = ficha.citas.map(apt => ({
        id: apt.id,
        date: apt.fecha,
        status: apt.estado === 'PENDIENTE' ? 'PENDING' :
            apt.estado === 'CONFIRMADA' ? 'CONFIRMED' :
                apt.estado === 'CANCELADA' ? 'CANCELLED' : apt.estado,
        notes: apt.notas
    }));

    return (
        <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
            <div className="w-full max-w-4xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900">Mis Reservas</h1>
                        <p className="text-zinc-500 mt-1">Historial de tus horas médicas</p>
                    </div>
                    <Link
                        href="/reservar"
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Agendar Nueva
                    </Link>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
                    {appointments.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-medium text-zinc-900">Sin reservas aún</h3>
                            <p className="text-zinc-500 mt-1">No tienes horas agendadas en este momento.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {appointments.map((apt) => (
                                <div key={apt.id} className="p-6 hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold text-zinc-900">
                                                {new Date(apt.date).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                            <div className="flex items-center text-zinc-500 mt-1 text-sm">
                                                <Clock className="w-4 h-4 mr-1.5" />
                                                {new Date(apt.date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs
                                            </div>
                                            {apt.notes && (
                                                <div className="flex items-start text-zinc-500 mt-2 text-sm bg-zinc-50 p-2 rounded-md border border-zinc-100">
                                                    <FileText className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                                                    {apt.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${apt.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-200' :
                                            apt.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                                            }`}>
                                            {apt.status === 'PENDING' ? 'Pendiente' :
                                                apt.status === 'CONFIRMED' ? 'Confirmada' :
                                                    apt.status === 'CANCELLED' ? 'Cancelada' : apt.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-center">
                    <Link href="/portal" className="flex items-center text-zinc-500 hover:text-zinc-800 transition-colors text-sm font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver al Portal
                    </Link>
                </div>
            </div>
        </div>
    );
}
