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
import PatientExamsList from '@/components/PatientExamsList'

// ... imports remain the same

export default async function PatientHistoryPage({ params }: PageProps) {
    // Protect route - only users with "Ver Pacientes" permission
    await protectRoute({
        requiredPermission: 'Ver Pacientes',
        redirectTo: '/portal'
    });

    const { id } = await params

    // Fetch patient data with exams from Person/FichaClinica
    const persona = await prisma.persona.findUnique({
        where: { id },
        include: {
            fichaClinica: {
                include: {
                    examenes: {
                        orderBy: { creadoEn: 'desc' }
                    },
                    citas: {
                        orderBy: { fecha: 'desc' },
                        take: 10
                    }
                }
            }
        }
    })

    if (!persona) {
        notFound()
    }

    // Map to interface expected by the UI
    const patient = {
        id: persona.id,
        name: `${persona.nombre} ${persona.apellidoPaterno} ${persona.apellidoMaterno || ''}`.trim(),
        rut: persona.rut,
        email: persona.email || 'Sin email',
        commune: persona.comuna || 'Sin Comuna',
        address: persona.direccion || 'Sin Dirección',
        active: persona.activo,
        appointments: persona.fichaClinica?.citas.map(c => ({
            id: c.id,
            date: c.fecha,
            notes: c.notas,
            status: c.estado === 'PENDIENTE' ? 'PENDING' :
                c.estado === 'CONFIRMADA' ? 'CONFIRMED' :
                    c.estado === 'CANCELADA' ? 'CANCELLED' : c.estado
        })) || [],
        exams: persona.fichaClinica?.examenes.map(e => ({
            id: e.id,
            fileName: e.archivoNombre,
            fileUrl: e.archivoUrl.includes('api/mock-storage')
                ? `/api/mock-storage/${e.archivoUrl.split('/').pop()}`
                : e.archivoUrl,
            centerName: e.nombreCentro,
            doctorName: e.nombreDoctor,
            examDate: e.fechaExamen,
            createdAt: e.creadoEn,
            source: e.origen === 'PORTAL_PACIENTES' ? 'portal pacientes' : 'interno',
            reviewed: e.revisado
        })) || []
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/patients"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Gestión de Pacientes
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Historial de {patient.name}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        RUT: {patient.rut} • Email: {patient.email}
                    </p>
                </div>

                <div className="space-y-8">

                    {/* Section 1: Patient Information */}
                    <div className="bg-white rounded-lg shadow-md p-6">
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

                            <PatientExamsList exams={patient.exams} allowAdminActions={true} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
