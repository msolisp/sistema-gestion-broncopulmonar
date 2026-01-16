'use client';

import Link from "next/link";
import { LogOut, Activity, Calendar, FileText, Home, User, Stethoscope } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getPatientProfile } from "@/actions/patient-profile";

interface PatientNavbarProps {
    initialUserName?: string;
}

export default function PatientNavbar({ initialUserName }: PatientNavbarProps) {
    const { data: session, status } = useSession();
    // Initialize with prop if available, otherwise empty string (waiting for client session)
    const [userName, setUserName] = useState<string>(initialUserName || "");

    useEffect(() => {
        async function fetchName() {
            if (status === 'loading') return;

            if (session?.user?.email) {
                // Optimistic update from session if available
                if (session.user.name && session.user.name !== "Admin User" && session.user.name !== "Paciente") {
                    setUserName(session.user.name.split(' ')[0]);
                    return; // If we have a good name, no need to fetch immediately (or we can fetch in bg)
                }

                // Fetch latest from DB to be sure
                try {
                    const result = await getPatientProfile();
                    if (result?.user?.name) {
                        setUserName(result.user.name.split(' ')[0]);
                    } else {
                        setUserName("Paciente");
                    }
                } catch (e) {
                    console.error("Failed to fetch navbar name", e);
                    setUserName("Paciente");
                }
            } else {
                setUserName("Paciente"); // Fallback if no session/email
            }
        }
        fetchName();
    }, [session, status]);

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
                            <Link href="/portal/citas" className="border-transparent text-zinc-500 hover:border-indigo-500 hover:text-zinc-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                <Calendar className="w-4 h-4 mr-2" />
                                Mis Citas
                            </Link>
                            <Link href="/portal/examenes" className="border-transparent text-zinc-500 hover:border-indigo-500 hover:text-zinc-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Mis Exámenes
                            </Link>
                            <Link href="/portal/historial" className="border-transparent text-zinc-500 hover:border-indigo-500 hover:text-zinc-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                <FileText className="w-4 h-4 mr-2" />
                                Mi Historial
                            </Link>
                            <Link href="/portal/perfil" className="border-transparent text-zinc-500 hover:border-indigo-500 hover:text-zinc-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                <User className="w-4 h-4 mr-2" />
                                Mis Datos
                            </Link>
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
