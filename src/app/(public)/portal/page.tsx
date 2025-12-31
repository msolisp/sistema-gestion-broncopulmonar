import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Calendar, User, Cloud, MapPin } from 'lucide-react';
import Link from 'next/link';
import AppointmentList from '@/components/AppointmentList';
import PatientProfileForm from '@/components/PatientProfileForm';
import { logout } from '@/lib/actions';
import { getRealtimeGlobalAQI, normalizeCommune, AQIData } from '@/lib/air-quality';
import AirQualityMapWrapper from '@/components/AirQualityMapWrapper';

function AirQualityWidget({ data, communeName }: { data: AQIData | undefined, communeName: string }) {
    // Default fallback if no data found for the commune
    const displayData = data || {
        commune: communeName,
        value: 0,
        level: 'Sin Información',
        color: '#9ca3af'
    };

    return (
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-zinc-200 shadow-sm">
            <div className={`p-1.5 rounded-full`} style={{ backgroundColor: displayData.color + '20' }}>
                <Cloud size={18} style={{ color: displayData.color }} />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] uppercase text-zinc-400 font-bold leading-none">Calidad Aire - {communeName}</span>
                <span className="text-sm font-bold text-zinc-700 leading-none mt-1">
                    {displayData.value > 0 ? `${displayData.level}` : 'Sin datos'} <span className="text-zinc-400 font-normal">({displayData.value > 0 ? displayData.value : '-'})</span>
                </span>
            </div>
        </div>
    )
}

export default async function PortalPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect('/login?callbackUrl=/portal');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            name: true,
            email: true,
            patientProfile: {
                include: {
                    appointments: {
                        orderBy: { date: 'desc' }
                    }
                }
            }
        }
    });

    if (!user || !user.patientProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
                <div className="bg-white p-8 rounded-xl shadow-md border border-zinc-100 max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-2">Perfil no encontrado</h1>
                    <p className="text-zinc-600 mb-6">No pudimos encontrar tu perfil de paciente.</p>
                    <Link href="/" className="text-indigo-600 hover:underline">Volver al inicio</Link>
                    <form action={logout}>
                        <button type="submit" className="mt-4 text-sm text-zinc-500 underline">Cerrar Sesión</button>
                    </form>
                </div>
            </div>
        );
    }

    const appointments = user.patientProfile.appointments;
    const commune = user.patientProfile.commune || 'SANTIAGO';

    // Fetch Realtime AQI Data
    const allAQI = await getRealtimeGlobalAQI();
    const normalizedUserCommune = normalizeCommune(commune);

    // Find exact match or falls back to nearest logic if implemented (currently exact match)
    // If exact match fails, we could look for "Santiago" general station
    const userAQI = allAQI.find(d => d.commune === normalizedUserCommune)
        || allAQI.find(d => d.commune === 'SANTIAGO')
        || allAQI.find(d => d.commune === 'PARQUE O\'HIGGINS'); // Common central station

    return (
        <div className="min-h-screen bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900">Portal del Paciente</h1>
                        <p className="text-zinc-500 mt-1">Bienvenido, {user.name || user.email}</p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Widget */}
                        <AirQualityWidget data={userAQI} communeName={commune} />

                        <div className="flex items-center gap-3">
                            <Link
                                href="/reservar"
                                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Agendar Hora</span>
                                <span className="sm:hidden">Agendar</span>
                            </Link>
                            <form action={logout}>
                                <button
                                    type="submit"
                                    className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 font-medium transition-colors"
                                >
                                    Cerrar Sesión
                                </button>
                            </form>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile */}
                    <div className="lg:col-span-1 space-y-6">
                        <PatientProfileForm user={user} />
                    </div>

                    {/* Right Column: Map & Appointments */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Map Section */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
                            <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                                <Cloud className="w-5 h-5 text-indigo-600" />
                                Monitoreo Ambiental (Estaciones SINCA)
                            </h3>
                            <AirQualityMapWrapper userCommune={commune} aqiData={allAQI} />
                        </div>

                        {/* Appointments Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-zinc-900 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                                    Últimas Reservas
                                </h2>
                                {appointments.length > 3 && (
                                    <Link href="/mis-reservas" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                        Ver todas
                                    </Link>
                                )}
                            </div>
                            <AppointmentList appointments={appointments.slice(0, 3)} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
