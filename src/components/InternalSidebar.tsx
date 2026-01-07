'use client';

import Link from "next/link";
import { LogOut, Activity, Users, FileText, Settings, Sparkles } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

interface InternalSidebarProps {
    user?: {
        name?: string | null;
        role?: string | null;
    }
}

export default function InternalSidebar({ user }: InternalSidebarProps) {
    const { data: session } = useSession();

    // Hybrid check: Use prop if available (Server Component), fallback to Client Session
    const effectiveUser = user || session?.user;

    const userName = effectiveUser?.name || 'Usuario';
    const userRole = effectiveUser?.role || 'Role';

    return (
        <aside className="w-64 bg-white border-r border-zinc-200 hidden md:flex flex-col shadow-sm z-10">
            <div className="p-6 flex items-start gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg shrink-0 text-indigo-600 mt-1">
                    <Activity className="h-6 w-6" />
                </div>
                <h1 className="text-sm font-bold text-zinc-900 leading-snug">
                    Sistema de Gestión <br />
                    <span className="text-indigo-600 block text-base">Centro de Rehabilitación Pulmonar</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                <Link href="/patients" className="flex items-center px-4 py-2.5 text-sm font-medium text-zinc-700 rounded-lg hover:bg-zinc-50 hover:text-indigo-600 group">
                    <Users className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-indigo-600" />
                    Pacientes
                </Link>
                <Link href="/reports" className="flex items-center px-4 py-2.5 text-sm font-medium text-zinc-700 rounded-lg hover:bg-zinc-50 hover:text-indigo-600 group">
                    <FileText className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-indigo-600" />
                    Reportes BI
                </Link>
                {/* <Link href="/asistente" className="flex items-center px-4 py-2.5 text-sm font-medium text-zinc-700 rounded-lg hover:bg-zinc-50 hover:text-indigo-600 group">
                    <Sparkles className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-indigo-600" />
                    Asistente IA
                </Link> */}
                {/* Admin Only Link */}
                {userRole === 'ADMIN' && (
                    <Link href="/dashboard" className="flex items-center px-4 py-2.5 text-sm font-medium text-zinc-700 rounded-lg hover:bg-zinc-50 hover:text-indigo-600 group">
                        <Settings className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-indigo-600" />
                        Administración
                    </Link>
                )}
            </nav>

            <div className="p-4 border-t border-zinc-200">
                <div className="flex items-center mb-4">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {userName[0] || 'U'}
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-zinc-900">{userName}</p>
                        <p className="text-xs text-zinc-500">{userRole}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/intranet/login' })}
                    className="flex w-full items-center px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}
