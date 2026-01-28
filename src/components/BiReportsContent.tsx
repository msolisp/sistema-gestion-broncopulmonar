'use client'

import { useState, useMemo } from "react"
import { Search, MapPin, Download, Table as TableIcon, Users, Activity, TrendingUp, UserCheck, AlertCircle, X, Thermometer, Building2, Stethoscope, CreditCard } from "lucide-react"
import dynamic from 'next/dynamic'
import * as XLSX from 'xlsx'

// Dynamic import for Map to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-zinc-100 animate-pulse rounded-xl flex items-center justify-center text-zinc-400">Cargando Mapa...</div>
})
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line
} from 'recharts'

interface BiReportsContentProps {
    patients: Array<{
        id: string;
        commune: string;
        diagnosisDate: Date | null;
        birthDate: Date | null;
        gender: string | null;
        healthSystem: string | null;
        rut: string | null;
        // user: { name: string | null; email: string; rut: string | null }; // Removed
        exams: Array<{
            centerName: string;
            doctorName: string;
            examDate: Date;
        }>;
    }>
}

export default function BiReportsContent({ patients }: BiReportsContentProps) {
    const [selectedYear, setSelectedYear] = useState<string | null>(null)
    const [selectedCommune, setSelectedCommune] = useState<string | null>(null)

    // Derive Options
    const { years, communes } = useMemo(() => {
        const y = new Set<string>()
        const c = new Set<string>()
        patients.forEach(p => {
            if (p.diagnosisDate) y.add(new Date(p.diagnosisDate).getFullYear().toString())
            p.exams.forEach(e => y.add(new Date(e.examDate).getFullYear().toString()))
            c.add(p.commune)
        })
        return {
            years: Array.from(y).sort().reverse(),
            communes: Array.from(c).sort()
        }
    }, [patients])

    // Filter Logic
    const filteredPatients = useMemo(() => {
        let filtered = patients

        if (selectedYear) {
            // Filter by diagnosis date OR exam date matching the year?
            // Usually simpler to filter by the primary entity's active period or diagnosis
            // users might expect to see everything related to that year.
            // Let's filter patients who had ACTIVITY (diagnosis or exam) in that year.
            filtered = filtered.filter(p => {
                const diagYear = p.diagnosisDate ? new Date(p.diagnosisDate).getFullYear().toString() : null
                const hasExamInYear = p.exams.some(e => new Date(e.examDate).getFullYear().toString() === selectedYear)
                return diagYear === selectedYear || hasExamInYear
            })
        }

        if (selectedCommune) {
            filtered = filtered.filter(p => p.commune === selectedCommune)
        }

        return filtered
    }, [selectedYear, selectedCommune, patients])

    // Metric Calculations
    const metrics = useMemo(() => {
        const totalPatients = filteredPatients.length
        const totalExams = filteredPatients.reduce((acc, p) => acc + p.exams.length, 0)

        // 1. Health System Distribution
        const healthCounts: Record<string, number> = {}
        filteredPatients.forEach(p => {
            const sys = p.healthSystem || 'No Informado'
            healthCounts[sys] = (healthCounts[sys] || 0) + 1
        })
        const healthSystemData = Object.entries(healthCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)

        // 2. Seasonality & Clinical Metrics Base
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        const monthCounts: Record<number, number> = {}

        // 3. Winter vs Summer Setup
        // Winter: May(4) - Aug(7)
        // Summer: Nov(10) - Mar(2)
        let winterCount = 0
        let summerCount = 0
        const winterMonths = [4, 5, 6, 7]
        const summerMonths = [10, 11, 0, 1, 2]

        // 4. Comparative Epidemiology Setup
        const pedMonthCounts: Record<number, number> = {}
        const seniorMonthCounts: Record<number, number> = {}

        // 5. Adherence Setup
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        let activePatients = 0
        let inactivePatients = 0

        // 6. Demographics Setup (Avg Age)
        let maleSum = 0, maleCount = 0
        let femaleSum = 0, femaleCount = 0

        filteredPatients.forEach(p => {
            // Exam Analysis
            let lastExamDate: Date | null = null
            p.exams.forEach(e => {
                const d = new Date(e.examDate)
                if (selectedYear && d.getFullYear().toString() !== selectedYear) return

                const m = d.getMonth()
                monthCounts[m] = (monthCounts[m] || 0) + 1
                if (winterMonths.includes(m)) winterCount++
                if (summerMonths.includes(m)) summerCount++

                // Comparative Epi
                if (p.birthDate) {
                    const age = new Date().getFullYear() - new Date(p.birthDate).getFullYear()
                    if (age < 18) pedMonthCounts[m] = (pedMonthCounts[m] || 0) + 1
                    if (age > 65) seniorMonthCounts[m] = (seniorMonthCounts[m] || 0) + 1
                }

                if (!lastExamDate || d > lastExamDate) lastExamDate = d
            })

            // Adherence
            // Adherence
            if (lastExamDate && (lastExamDate as Date).getTime() > sixMonthsAgo.getTime()) activePatients++
            else inactivePatients++

            // Demographics Avg Age
            if (p.birthDate) {
                const age = new Date().getFullYear() - new Date(p.birthDate).getFullYear()
                if (p.gender === 'Masculino' || p.gender === 'M') { maleSum += age; maleCount++ }
                else if (p.gender === 'Femenino' || p.gender === 'F') { femaleSum += age; femaleCount++ }
            }
        })

        const seasonalityData = months.map((name, index) => ({
            name,
            total: monthCounts[index] || 0,
            pediatric: pedMonthCounts[index] || 0,
            senior: seniorMonthCounts[index] || 0
        }))

        // Avg Age Results
        const avgAgeMale = maleCount > 0 ? Math.round(maleSum / maleCount) : 0
        const avgAgeFemale = femaleCount > 0 ? Math.round(femaleSum / femaleCount) : 0

        const adherenceData = [
            { name: 'Activos (<6m)', value: activePatients },
            { name: 'Inactivos', value: inactivePatients }
        ]



        // 4. Clinical Age Groups (Pediatric, Adult, Senior)
        const ageGroups = { 'Pediátrico (<18)': 0, 'Adulto (18-65)': 0, 'Senior (>65)': 0 }

        filteredPatients.forEach(p => {
            if (p.birthDate) {
                const age = new Date().getFullYear() - new Date(p.birthDate).getFullYear()
                if (age < 18) ageGroups['Pediátrico (<18)']++
                else if (age <= 65) ageGroups['Adulto (18-65)']++
                else ageGroups['Senior (>65)']++
            }
        })

        const clinicalAgeData = Object.entries(ageGroups).map(([name, value]) => ({ name, value })).filter(d => d.value > 0)

        // 5. Gender (Masculino/Femenino only)
        const genderCounts: Record<string, number> = {}
        filteredPatients.forEach(p => {
            let g = p.gender
            if (g === 'M') g = 'Masculino'
            if (g === 'F') g = 'Femenino'

            if (g === 'Masculino' || g === 'Femenino') {
                genderCounts[g] = (genderCounts[g] || 0) + 1
            }
        })

        const genderData = Object.entries(genderCounts).map(([name, value]) => ({ name, value }))

        // 6. Yearly Evolution (Diagnosis Trend)
        const yearCounts: Record<string, number> = {}
        filteredPatients.forEach(p => {
            const y = p.diagnosisDate ? new Date(p.diagnosisDate).getFullYear().toString() : 'Sin Fecha'
            if (y !== 'Sin Fecha') yearCounts[y] = (yearCounts[y] || 0) + 1
        })
        const diagnosisTrendData = Object.entries(yearCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => a.name.localeCompare(b.name))

        return {
            totalPatients,
            totalExams,
            healthSystemData,
            seasonalityData,
            genderData,
            clinicalAgeData,
            diagnosisTrendData,
            winterCount,
            summerCount,
            avgAgeMale,
            avgAgeFemale,
            adherenceData
        }
    }, [filteredPatients, selectedYear])

    const handleExport = () => {
        const wb = XLSX.utils.book_new()

        // Sheet 1: Patients
        const patientsData = filteredPatients.map(p => ({
            RUT: p.rut,
            Comuna: p.commune,
            'Fecha Diagnóstico': p.diagnosisDate ? new Date(p.diagnosisDate).toLocaleDateString('es-CL', { timeZone: 'UTC' }) : '',
            'Edad': p.birthDate ? new Date().getFullYear() - new Date(p.birthDate).getFullYear() : '',
            'Género': p.gender,
            'Sistema Salud': p.healthSystem,
            'Total Exámenes': p.exams.length
        }))
        const wsPatients = XLSX.utils.json_to_sheet(patientsData)
        XLSX.utils.book_append_sheet(wb, wsPatients, "Pacientes")

        // Sheet 2: Exams
        const examsData = filteredPatients.flatMap(p =>
            p.exams.map(e => ({
                'RUT Paciente': p.rut,
                'Centro': e.centerName,
                'Doctor': e.doctorName,
                'Fecha': new Date(e.examDate).toLocaleDateString('es-CL', { timeZone: 'UTC' })
            }))
        )
        const wsExams = XLSX.utils.json_to_sheet(examsData)
        XLSX.utils.book_append_sheet(wb, wsExams, "Exámenes")

        // Use XLSX.writeFile which is more robust for filename/extension preservation
        const fileName = `Reporte_Broncopulmonar_${new Date().toISOString().split('T')[0]}.xlsx`
        XLSX.writeFile(wb, fileName)
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    const AGE_COLORS = ['#3b82f6', '#10b981', '#f59e0b']; // Blue (Ped), Emerald (Adult), Amber (Senior)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900">Dashboard Clínico</h2>
                    <p className="text-zinc-500 text-sm">Métricas de Kinesiología Broncopulmonar</p>
                </div>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-600">Año:</span>
                        <select
                            className="bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                            value={selectedYear || ''}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {years.map(y => <option key={`year-${y}`} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-600">Comuna:</span>
                        <select
                            className="bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                            value={selectedCommune || ''}
                            onChange={(e) => setSelectedCommune(e.target.value)}
                        >
                            <option value="">Todas</option>
                            {communes.map(c => <option key={`commune-${c}`} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="h-8 w-px bg-zinc-200 mx-2" />
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                        <Download className="h-4 w-4" />
                        EXPORTAR
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-zinc-500 mb-1">Total Pacientes</p>
                        <h3 className="text-3xl font-bold text-zinc-900">{metrics.totalPatients}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
                <div
                    className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-help"
                    title="Promedio de exámenes por paciente. Indica la cronicidad o recurrencia de tu población (mayor número = pacientes más complejos)."
                >
                    <div>
                        <p className="text-sm font-medium text-zinc-500 mb-1">Intensidad (Ex/Pac)</p>
                        <h3 className="text-3xl font-bold text-zinc-900">
                            {metrics.totalPatients > 0 ? (metrics.totalExams / metrics.totalPatients).toFixed(1) : 0}
                        </h3>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <Activity className="h-6 w-6 text-indigo-600" />
                    </div>
                </div>
                <div
                    className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-help"
                    title="Muestra qué % de tu carga anual se concentra en la Campaña de Invierno vs Verano."
                >
                    <div>
                        <p className="text-sm font-medium text-zinc-500 mb-1">Carga Invernal (May-Ago)</p>
                        <h3 className="text-3xl font-bold text-zinc-900">
                            {metrics.totalExams > 0 ? Math.round((metrics.winterCount / metrics.totalExams) * 100) : 0}%
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1">vs {metrics.summerCount} en Verano</p>
                    </div>
                    <div className="p-3 bg-cyan-50 rounded-lg shrink-0">
                        <Thermometer className="h-6 w-6 text-cyan-600" />
                    </div>
                </div>
                <div
                    className="bg-white p-6 rounded-xl border border-zinc-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md cursor-help"
                    title="Promedio de Edad Diferenciado: Hombres vs Mujeres."
                >
                    <div>
                        <p className="text-sm font-medium text-zinc-500 mb-1">Promedio Edad</p>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-blue-600">H: {metrics.avgAgeMale} años</span>
                            <span className="text-sm font-bold text-rose-600">M: {metrics.avgAgeFemale} años</span>
                        </div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg shrink-0">
                        <UserCheck className="h-6 w-6 text-orange-600" />
                    </div>
                </div>
            </div>

            {/* Row 1: Comparative Epidemiology & Clinical Age (Risk Profile) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Comparative Epi (Takes 2/3) */}
                <div
                    className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm lg:col-span-2 flex flex-col transition-all hover:shadow-md cursor-help"
                    title="Línea Azul: Pediátricos (<18) -> Picos de virus respiratorios (VRS). Línea Ámbar: Adulto Mayor (>65) -> Crónicos / Descompensaciones (EPOC). Esto permite ver si tus peaks de niños coinciden con los de abuelos."
                >
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="text-indigo-600 h-5 w-5" />
                        <h3 className="text-zinc-800 font-bold">Curva Epidemiológica Comparada</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics.seasonalityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="pediatric"
                                    name="Pediátrico (<18)"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="senior"
                                    name="Adulto Mayor (>65)"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    dot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 text-center">Comparativa de carga viral (Invierno) vs crónica.</p>
                </div>

                {/* Risk Profile (Pie) - formerly Clinical Age */}
                <div
                    className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col transition-all hover:shadow-md cursor-help"
                    title="Distribución de pacientes según riesgo clínico: Pediátrico (VRS), Adulto (Laboral), Senior (Crónico)."
                >
                    <div className="flex items-center gap-2 mb-6">
                        <AlertCircle className="text-emerald-600 h-5 w-5" />
                        <h3 className="text-zinc-800 font-bold">Perfil de Riesgo</h3>
                    </div>
                    <div className="h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics.clinicalAgeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {metrics.clinicalAgeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-sm font-medium text-zinc-500 mt-[-40px]">
                                Grupos
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Adherence & Yearly Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Adherence */}
                <div
                    className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm transition-all hover:shadow-md cursor-help"
                    title="Identifica pacientes 'Activos' (control < 6 meses) versus 'Inactivos' que requieren rescate."
                >
                    <div className="flex items-center gap-2 mb-4">
                        <UserCheck className="text-blue-500 h-5 w-5" />
                        <h3 className="text-zinc-800 font-bold">Adherencia de Control</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics.adherenceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#10b981" /> {/* Active - Emerald */}
                                    <Cell fill="#9ca3af" /> {/* Inactive - Gray */}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-zinc-500 text-center mt-2">Pacientes con exámenes en los últimos 6 meses.</p>
                </div>

                {/* Yearly Evolution (Moved here) */}
                <div
                    className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm transition-all hover:shadow-md cursor-help"
                    title="Tendencia histórica del volumen de pacientes para proyección de crecimiento."
                >
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="text-orange-500 h-5 w-5" />
                        <h3 className="text-zinc-800 font-bold">Evolución Anual</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.diagnosisTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#fff7ed' }} />
                                <Bar dataKey="value" name="Casos" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 3: Demographics (Health System & Gender) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Health System Chart */}
                <div
                    className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center transition-all hover:shadow-md cursor-help"
                    title="Segmentación socioeconómica (FONASA vs ISAPRE) para gestión de convenios."
                >
                    <div className="flex items-center gap-2 mb-4 w-full">
                        <CreditCard className="text-emerald-600 h-5 w-5" />
                        <h3 className="text-zinc-800 font-bold">Previsión</h3>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics.healthSystemData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    fill="#82ca9d"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {metrics.healthSystemData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gender Chart */}
                <div
                    className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col items-center transition-all hover:shadow-md cursor-help"
                    title="Distribución demográfica para epidemiología focalizada."
                >
                    <div className="flex items-center gap-2 mb-4 w-full">
                        <Users className="text-purple-600 h-5 w-5" />
                        <h3 className="text-zinc-800 font-bold">Género</h3>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics.genderData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {metrics.genderData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Existing Map Section */}
            <div
                className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col p-6 transition-all hover:shadow-md cursor-help"
                title="Geo-referenciación para identificar zonas calientes y planificar operativos."
            >
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="text-red-500 h-5 w-5" />
                    <h3 className="text-zinc-800 font-bold">Distribución Geográfica</h3>
                </div>
                <Map patients={filteredPatients} />
            </div>
        </div>
    )
}
