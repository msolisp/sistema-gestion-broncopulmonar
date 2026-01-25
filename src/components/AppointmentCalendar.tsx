'use client';

import { useRouter } from "next/navigation";

interface Appointment {
    id: string;
    date: string;
    status: string;
    notes: string | null;
    patient: {
        name: string | null;
        email: string;
        rut: string | null;
    }
}

interface AppointmentCalendarProps {
    appointments: Appointment[];
}

export default function AppointmentCalendar({ appointments }: AppointmentCalendarProps) {
    const router = useRouter();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                <h3 className="font-bold text-zinc-700">Reservas Web</h3>
                <button onClick={() => router.refresh()} className="text-xs text-indigo-600 hover:underline">
                    Actualizar
                </button>
            </div>
            <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-100">
                        <tr>
                            <th className="px-6 py-3">Fecha y Hora</th>
                            <th className="px-6 py-3">Paciente</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3">Notas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {appointments.length > 0 ? (
                            appointments.map((app) => (
                                <tr key={app.id} className="bg-white hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-zinc-900 whitespace-nowrap">
                                        <span suppressHydrationWarning>
                                            {new Date(app.date).toLocaleString('es-CL')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-900">{app.patient.name || 'Sin Nombre'}</div>
                                        <div className="text-xs text-zinc-500">{app.patient.rut || app.patient.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${app.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 border-green-200' :
                                            app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                'bg-red-100 text-red-700 border-red-200'
                                            }`}>
                                            {app.status === 'CONFIRMED' ? 'Confirmada' :
                                                app.status === 'PENDING' ? 'Pendiente' :
                                                    app.status === 'CANCELLED' ? 'Cancelada' : app.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500 max-w-xs truncate">
                                        {app.notes || '-'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                    No hay reservas registradas en el sistema.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
