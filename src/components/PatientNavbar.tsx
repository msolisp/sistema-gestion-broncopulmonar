'use client';

import Link from "next/link";
import { LogOut, Activity, Calendar, FileText, Home, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getPatientProfile } from "@/actions/patient-profile";

export default function PatientNavbar() {
    const { data: session } = useSession();
    const [userName, setUserName] = useState<string>("Paciente");

    useEffect(() => {
        async function fetchName() {
            if (session?.user?.id) {
                // Optimistic update from session if available
                if (session.user.name && session.user.name !== "Admin User") {
                    setUserName(session.user.name.split(' ')[0]);
                }

                // Fetch latest from DB to be sure
                try {
                    const result = await getPatientProfile();
                    if (result?.user?.name) {
                        setUserName(result.user.name.split(' ')[0]);
                    }
                } catch (e) {
                    console.error("Failed to fetch navbar name", e);
                }
            }
        }
        fetchName();
    }, [session]);

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
                        <span className="text-sm text-zinc-500 mr-4">Hola, {userName}</span>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-2 text-zinc-400 hover:text-red-600 rounded-full hover:bg-red-50"
                            aria-label="Cerrar sesión"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
