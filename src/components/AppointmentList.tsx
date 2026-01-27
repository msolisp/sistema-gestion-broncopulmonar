import { Calendar, Clock, FileText } from 'lucide-react';

interface AppointmentListProps {
    appointments: any[];
}

export default function AppointmentList({ appointments }: AppointmentListProps) {
    if (appointments.length === 0) {
        return (
            <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-zinc-200">
                <div className="w-16 h-16 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900">Sin reservas aún</h3>
                <p className="text-zinc-500 mt-1">No tienes horas agendadas en este momento.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="divide-y divide-zinc-100">
                {appointments.map((apt) => (
                    <div key={apt.id} className="p-6 hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-zinc-900">
                                    {new Date(apt.date).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
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
        </div>
    );
}
