
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User } from "lucide-react";

export default async function MyAppointmentsPage() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const appointments = await prisma.appointment.findMany({
        where: {
            patient: { userId: session.user.id }
        },
        orderBy: { date: 'desc' }
    });

    const upcoming = appointments.filter(a => new Date(a.date) >= new Date() && a.status !== 'CANCELLED');
    const past = appointments.filter(a => new Date(a.date) < new Date() || a.status === 'CANCELLED');

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-zinc-900">Mis Citas</h1>

            {/* UPCOMING */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-zinc-700 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Próximas Atenciones
                </h2>
                {upcoming.length === 0 ? (
                    <Card className="bg-zinc-50 border-dashed shadow-sm">
                        <CardContent className="pt-6 text-center text-zinc-500">
                            No tienes citas programadas.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {upcoming.map(app => (
                            <AppointmentCard key={app.id} appointment={app} />
                        ))}
                    </div>
                )}
            </section>

            {/* PAST */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-zinc-700 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-zinc-400" />
                    Historial
                </h2>
                {past.length === 0 ? (
                    <p className="text-zinc-500 text-sm pl-2">No hay historial disponible.</p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-90">
                        {past.map(app => (
                            <AppointmentCard key={app.id} appointment={app} isPast />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function AppointmentCard({ appointment, isPast }: { appointment: any, isPast?: boolean }) {
    const statusMap: Record<string, { label: string, color: string }> = {
        'PENDING': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
        'CONFIRMED': { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
        'CANCELLED': { label: 'Cancelada', color: 'bg-red-100 text-red-800' }
    };

    const status = statusMap[appointment.status] || { label: appointment.status, color: 'bg-gray-100' };
    const date = new Date(appointment.date);

    return (
        <Card className={`${isPast ? 'bg-zinc-50 shadow-sm' : 'bg-white border-indigo-100 shadow-md'}`}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base font-semibold">
                            {date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </CardTitle>
                        <p className="text-sm text-zinc-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs
                        </p>
                    </div>
                    <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 text-sm text-zinc-600">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-zinc-400" />
                        <span>Centro Broncopulmonar</span>
                    </div>
                    {appointment.notes && (
                        <div className="p-2 bg-zinc-100 rounded text-xs italic mt-2">
                            "{appointment.notes}"
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
