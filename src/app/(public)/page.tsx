import Link from "next/link";
import { ArrowRight, Activity, Calendar, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-100">
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-indigo-600" />
          <span className="text-xl font-bold text-zinc-900">Broncopulmonar</span>
        </div>
        <nav className="flex items-center space-x-4">
          <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-indigo-600">
            Iniciar Sesión
          </Link>
          <Link href="/register" className="text-sm font-medium px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500">
            Registrarse
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
            Gestión Integral de <span className="text-indigo-600">Fibrosis Pulmonar</span>
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            Una plataforma unificada para el seguimiento de pacientes, gestión de citas y análisis de datos en tiempo real. Diseñada para mejorar la calidad de vida.
          </p>
          <div className="flex items-center justify-center space-x-4 pt-4">
            <Link href="/register" className="flex items-center px-6 py-3 text-base font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all">
              Comenzar Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/login" className="px-6 py-3 text-base font-medium text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100">
              Portal Pacientes
            </Link>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="px-6 py-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
            <Calendar className="h-8 w-8 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">Reserva de Horas</h3>
            <p className="text-zinc-500">Agenda tus controles médicos de forma rápida y sencilla desde cualquier dispositivo.</p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
            <Activity className="h-8 w-8 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">Monitoreo Constante</h3>
            <p className="text-zinc-500">Seguimiento detallado de tu historial médico y evolución del tratamiento.</p>
          </div>
          <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
            <Shield className="h-8 w-8 text-indigo-600 mb-4" />
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">Seguridad Total</h3>
            <p className="text-zinc-500">Tus datos están protegidos con los más altos estándares de seguridad y privacidad.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-zinc-400 border-t border-zinc-100">
        © 2025 Sistema de Gestión Broncopulmonar. Todos los derechos reservados.
      </footer>
    </div>
  );
}
