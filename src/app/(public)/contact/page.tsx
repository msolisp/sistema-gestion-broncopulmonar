import Link from "next/link";
import { ArrowLeft, Mail, MapPin, User } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[#0B1120] text-white selection:bg-emerald-500/30 flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4" />

            <div className="w-full max-w-lg bg-slate-800/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10 animate-zoom-in">
                <Link
                    href="/"
                    className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Volver al inicio
                </Link>

                <h1 className="text-3xl font-bold mb-2">Contacto Profesional</h1>
                <p className="text-slate-400 mb-8">Para consultas técnicas o soporte sobre la plataforma.</p>

                <div className="space-y-6">
                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <User className="h-6 w-6 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Desarrollador Responsable</p>
                            <p className="text-lg font-medium text-white">Maximiliano Solis</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Mail className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Correo Electrónico</p>
                            <a href="mailto:max.solis@gmail.com" className="text-lg font-medium text-white hover:text-emerald-400 transition-colors">
                                max.solis@gmail.com
                            </a>
                        </div>
                    </div>
                    <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="p-2 bg-rose-500/20 rounded-lg">
                            <MapPin className="h-6 w-6 text-rose-400" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Ubicación</p>
                            <p className="text-lg font-medium text-white">
                                Santiago, Chile
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/10 text-center">
                    <p className="text-slate-500 text-sm">
                        © 2025 Sistema de Gestión Broncopulmonar
                    </p>
                </div>
            </div>
        </div>
    );
}
