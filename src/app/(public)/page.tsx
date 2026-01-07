import Link from "next/link";
import { ArrowRight, Activity, Calendar, Shield, HeartPulse, Stethoscope, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0B1120] text-white selection:bg-emerald-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4" />
      </div>

      {/* Navbar */}
      <header className="relative z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Broncopulmonar
            </span>
          </div>
          <nav className="flex items-center space-x-6">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all backdrop-blur-sm"
            >
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">


            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
              Gestión Integral de <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-400">
                Fibrosis Pulmonar
              </span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Plataforma especializada diseñada para el seguimiento exhaustivo de pacientes respiratorios.
              Optimiza la gestión clínica y mejora la calidad de vida a través de datos precisos.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
              <Link
                href="/register"
                className="group w-full sm:w-auto flex items-center justify-center px-8 py-4 text-base font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-2xl shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5"
              >
                Ver Demo Clínica
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto px-8 py-4 text-base font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-2xl transition-all"
              >
                Contacto Profesional
              </Link>
            </div>
          </div>

          {/* Right Visuals (Glass Cards) */}
          <div className="relative h-[500px] w-full hidden lg:block perspective-1000">
            {/* Image Container with Blend Masks */}
            <div className="relative w-full h-full">
              <img
                src="/hero-lungs-clean.png"
                alt="Visualización Pulmonar Avanzada"
                className="w-full h-full object-contain filter drop-shadow-2xl animate-float-slow opacity-90"
              />
              {/* Radial gradient overlay for seamless blending */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120]/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120]/80 via-transparent to-[#0B1120]/80 pointer-events-none" />
            </div>
            {/* REMOVED PREMATURE CLOSING DIV HERE */}

            {/* Floating Stat Card 1 - SpO2 */}
            <div className="absolute top-[10%] left-0 w-48 p-4 bg-slate-800/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl animate-float-delayed">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">SpO2 Promedio</span>
                <HeartPulse className="h-4 w-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-white">96%</div>
              <div className="text-xs text-emerald-400 mt-1 flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                Estable
              </div>
            </div>

            {/* Floating Stat Card 2 - TM6M */}
            <div className="absolute bottom-[20%] right-0 w-52 p-4 bg-slate-800/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl animate-float-delayed">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium">Distancia TM6M</span>
                <Activity className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-white">450m</div>
              <div className="text-xs text-indigo-400 mt-1">
                +12% vs mes anterior
              </div>
            </div>
          </div>
        </div>
      </main >

      {/* Features Grid Dark */}
      < section className="relative z-10 px-6 py-24 max-w-7xl mx-auto w-full" >
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Tecnología al Servicio de la Salud</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">Herramientas diseñadas específicamente para neumólogos y equipos multidisciplinarios.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-slate-800/40 border border-white/5 hover:bg-slate-800/60 hover:border-emerald-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
              <Calendar className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Reserva Fácil y Rápida</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Agenda tus controles médicos de forma sencilla y rápida desde cualquier dispositivo, sin complicaciones.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-800/40 border border-white/5 hover:bg-slate-800/60 hover:border-emerald-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
              <Activity className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Variables Clínicas</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Registro y visualización evolutiva de SpO2, TM6M, DLCO y Espirometría con alertas automáticas.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-800/40 border border-white/5 hover:bg-slate-800/60 hover:border-emerald-500/30 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 group-hover:bg-rose-500/20 transition-colors">
              <Users className="h-6 w-6 text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Expediente Centralizado</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Toda la información del paciente en un solo lugar, accesible de forma segura por el equipo tratante.
            </p>
          </div>
        </div>
      </section >

      {/* Footer */}
      < footer className="relative z-10 py-12 text-center text-sm text-slate-500 border-t border-white/5" >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p>© 2025 Sistema de Gestión Broncopulmonar.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Soporte</a>
          </div>
        </div>
      </footer >
    </div >
  );
}
