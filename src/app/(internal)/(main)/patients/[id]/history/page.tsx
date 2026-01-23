import { notFound } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { protectRoute } from '@/lib/route-protection'

const prisma = new PrismaClient()

interface PageProps {
    params: Promise<{ id: string }>
}

import ExamUploadForm from '@/components/ExamUploadForm'
import { PulmonaryHistory } from '@/components/PulmonaryHistory'

// ... imports remain the same

export default async function PatientHistoryPage({ params }: PageProps) {
    // Protect route - only users with "Ver Pacientes" permission
    await protectRoute({
        requiredPermission: 'Ver Pacientes',
        redirectTo: '/portal'
    });

    const { id } = await params

    // Fetch patient data with exams
    const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
            exams: {
                orderBy: { createdAt: 'desc' }
            },
            appointments: {
                orderBy: { date: 'desc' },
                take: 10
            }
        }
    })

    if (!patient) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Historial de {patient.name}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        RUT: {patient.rut} • Email: {patient.email}
                    </p>
                </div>

                <div className="space-y-8">

                    {/* Section 1: Patient Information & Appointments */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Patient Info - Spans 2 cols */}
                        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Información del Paciente
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div><span className="text-sm text-gray-500">Nombre:</span> <p className="font-medium">{patient.name}</p></div>
                                <div><span className="text-sm text-gray-500">RUT:</span> <p className="font-medium">{patient.rut}</p></div>
                                <div><span className="text-sm text-gray-500">Email:</span> <p className="font-medium">{patient.email}</p></div>
                                <div><span className="text-sm text-gray-500">Comuna:</span> <p className="font-medium">{patient.commune}</p></div>
                                <div><span className="text-sm text-gray-500">Dirección:</span> <p className="font-medium">{patient.address}</p></div>
                                <div>
                                    <span className="text-sm text-gray-500">Estado:</span>
                                    <p className="font-medium">
                                        <span className={`px-2 py-1 text-xs rounded-full ${patient.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {patient.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Appointments - Spans 1 col */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Últimas Citas
                            </h2>
                            {patient.appointments.length > 0 ? (
                                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                                    {patient.appointments.map((apt) => (
                                        <div key={apt.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg text-sm">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {new Date(apt.date).toLocaleDateString('es-CL')}
                                                </p>
                                                {apt.notes && <p className="text-xs text-gray-500 line-clamp-1">{apt.notes}</p>}
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {apt.status === 'CONFIRMED' ? 'Conf.' : apt.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">No hay citas recientes</div>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Pulmonary Function Graph */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <PulmonaryHistory patientId={patient.id} />
                    </div>

                    {/* Section 3: Exams Upload & List */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Exámenes y Documentos
                                </h2>
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                                    Total: {patient.exams.length}
                                </span>
                            </div>

                            {/* Upload Area */}
                            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                                <ExamUploadForm patientId={patient.id} />
                            </div>

                            {/* Exams List */}
                            {patient.exams.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archivo</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Centro / Médico</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origen</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {patient.exams.map((exam) => (
                                                <tr key={exam.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-red-100 rounded text-red-600">
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                                                            </div>
                                                            <span className="font-medium text-gray-700">
                                                                {exam.fileName || 'Documento PDF'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-900">{exam.centerName}</span>
                                                            <span className="text-xs">{exam.doctorName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(exam.examDate).toLocaleDateString('es-CL')}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <span className={`px-2 py-1 text-xs rounded-full border ${exam.source === 'portal pacientes' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                                            {exam.source === 'portal pacientes' ? 'Portal de Pacientes' : 'Portal Interno'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <a href={exam.fileUrl} target="_blank" className="text-indigo-600 font-medium hover:underline">Ver</a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-white border-2 border-dashed border-gray-100 rounded-lg">
                                    <p className="text-gray-500 text-sm">No hay exámenes registrados.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
