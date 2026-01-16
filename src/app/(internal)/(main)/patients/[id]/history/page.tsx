import { notFound } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const prisma = new PrismaClient()

interface PageProps {
    params: Promise<{ id: string }>
}

import ExamUploadForm from '@/components/ExamUploadForm'
import { PulmonaryHistory } from '@/components/PulmonaryHistory'

// ... imports remain the same

export default async function PatientHistoryPage({ params }: PageProps) {
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
                        href="/admin/dashboard"
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Patient Info & Appointments */}
                    <div className="space-y-6">
                        {/* Patient Info */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Información del Paciente
                            </h2>
                            <div className="space-y-3">
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

                        {/* Appointments Section */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Últimas Citas ({patient.appointments.length})
                            </h2>
                            {patient.appointments.length > 0 ? (
                                <div className="space-y-3">
                                    {patient.appointments.map((apt) => (
                                        <div key={apt.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {new Date(apt.date).toLocaleDateString('es-CL')}
                                                </p>
                                                {apt.notes && <p className="text-xs text-gray-500 mt-1">{apt.notes}</p>}
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {apt.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No hay citas registradas</p>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Clinical Data */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Pulmonary Function History (Restored) */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <PulmonaryHistory patientId={patient.id} />
                        </div>

                        {/* Exams Section */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex flex-col gap-4 mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Exámenes Médicos ({patient.exams.length})
                                </h2>
                                {/* Upload Form (Restored) */}
                                <ExamUploadForm patientId={patient.id} />
                            </div>

                            {patient.exams.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Archivo</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médico</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origen</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {patient.exams.map((exam) => (
                                                <tr key={exam.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 max-w-[150px] truncate">
                                                        {exam.fileName || 'Examen'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(exam.examDate).toLocaleDateString('es-CL')}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {exam.doctorName}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${exam.source === 'portal pacientes' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                            {exam.source === 'portal pacientes' ? 'Portal' : 'Interno'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <a href={exam.fileUrl} target="_blank" className="text-indigo-600 hover:underline">Ver</a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No hay exámenes registrados.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
