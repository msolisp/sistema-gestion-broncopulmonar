'use client';

import Link from "next/link";
import { LogOut, Activity, Calendar, FileText, Home, User, Stethoscope, FileSpreadsheet } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getPatientProfile } from "@/actions/patient-profile";
import { getMyPermissions } from "@/lib/actions.staff";

interface PatientNavbarProps {
    initialUserName?: string;
    serverPermissions?: { recurso: string, accion: string }[];
}

export default function PatientNavbar({ initialUserName, serverPermissions = [] }: PatientNavbarProps) {
    const { data: session, status } = useSession();
    const [userName, setUserName] = useState<string>(initialUserName || "");

    useEffect(() => {
        if (status === 'loading') return;

        if (session?.user?.email) {
            // Fetch profile for name only
            if (session.user.name && session.user.name !== "Admin User" && session.user.name !== "Paciente") {
                setUserName(session.user.name.split(' ')[0]);
            } else {
                getPatientProfile().then(result => {
                    if (result?.user?.name) setUserName(result.user.name.split(' ')[0]);
                });
            }
        }
    }, [session, status]);

    const canSee = (action: string) => {
        // Now checks specific actions for the Portal_Pacientes resource
        return serverPermissions.some(p => p.recurso === 'Portal_Pacientes' && p.accion === action);
    };

    return (
        <nav className="bg-white border-b border-zinc-200 relative z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                                <Activity className="h-6 w-6" />
                            </div>
                            <span className="font-bold text-zinc-900">Portal Paciente</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link href="/portal" prefetch={false} className="border-transparent text-zinc-500 hover:border-indigo-500 hover:text-zinc-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                <Home className="w-4 h-4 mr-2" />
                                Inicio
                            </Link>

                            {canSee('Subir Examenes') && (
                                <Link href="/portal/subir-examen" className="border-transparent text-zinc-500 hover:border-indigo-500 hover:text-zinc-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Subir Examen
                                </Link>
                            )}

                            {canSee('Ver Citas') && (
                                <Link href="/portal/citas" className="border-transparent text-zinc-500 hover:border-indigo-500 hover:text-zinc-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Mis Citas
                                </Link>
                            )}

                            {canSee('Ver Historial') && (
                                <Link href="/portal/historial" className="border-transparent text-zinc-500 hover:border-indigo-500 hover:text-zinc-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Historial Médico
                                </Link>
                            )}

                            {canSee('Ver Perfil') && (
                                <Link href="/portal/perfil" className="border-transparent text-zinc-500 hover:border-indigo-500 hover:text-zinc-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    <User className="w-4 h-4 mr-2" />
                                    Mis Datos
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        {userName && <span className="text-sm text-zinc-500 mr-4">Hola, {userName}</span>}
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            aria-label="Cerrar sesión"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
