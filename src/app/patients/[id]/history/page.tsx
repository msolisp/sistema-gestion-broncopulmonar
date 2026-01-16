import { notFound } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const prisma = new PrismaClient()

interface PageProps {
    params: Promise<{ id: string }>
}

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

                {/* Patient Info */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Información del Paciente
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                            <span className="text-sm text-gray-500">Nombre:</span>
                            <p className="font-medium">{patient.name}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500">RUT:</span>
                            <p className="font-medium">{patient.rut}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500">Email:</span>
                            <p className="font-medium">{patient.email}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500">Comuna:</span>
                            <p className="font-medium">{patient.commune}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500">Dirección:</span>
                            <p className="font-medium">{patient.address}</p>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500">Estado:</span>
                            <p className="font-medium">
                                <span className={`px-2 py-1 text-xs rounded-full ${patient.active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                    {patient.active ? 'Activo' : 'Inactivo'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Exams Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Exámenes Médicos ({patient.exams.length})
                    </h2>

                    {patient.exams.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Archivo
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Centro Médico
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Médico
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Fecha Examen
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Origen
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {patient.exams.map((exam) => (
                                        <tr key={exam.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-sm text-gray-900">
                                                        {exam.fileName || 'Examen.pdf'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {exam.centerName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {exam.doctorName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(exam.examDate).toLocaleDateString('es-CL')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 text-xs rounded-full ${exam.source === 'portal pacientes'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-purple-100 text-purple-700'
                                                    }`}>
                                                    {exam.source}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <a
                                                    href={exam.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Ver PDF
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No hay exámenes registrados
                            </h3>
                            <p className="text-gray-500">
                                Este paciente aún no tiene exámenes médicos en el sistema
                            </p>
                        </div>
                    )}
                </div>

                {/* Appointments Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Últimas Citas ({patient.appointments.length})
                    </h2>

                    {patient.appointments.length > 0 ? (
                        <div className="space-y-3">
                            {patient.appointments.map((apt) => (
                                <div key={apt.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {new Date(apt.date).toLocaleDateString('es-CL', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                        {apt.notes && (
                                            <p className="text-sm text-gray-500 mt-1">{apt.notes}</p>
                                        )}
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${apt.status === 'CONFIRMED'
                                            ? 'bg-green-100 text-green-700'
                                            : apt.status === 'PENDING'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {apt.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No hay citas registradas
                            </h3>
                            <p className="text-gray-500">
                                Este paciente no tiene citas programadas
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
