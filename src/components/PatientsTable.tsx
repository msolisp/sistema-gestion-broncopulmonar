'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { Search, Download, FileSpreadsheet, Plus, Edit, Trash2, X, UserCheck, History, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminCreatePatient, adminUpdatePatient, deletePatient } from "@/lib/actions" // Add actions

interface Patient {
    id: string
    rut: string
    commune: string

    diagnosisDate: Date | null
    gender: string | null        // Add gender
    address: string | null       // Add address
    birthDate: Date | null       // Add birthDate
    user: {
        name: string | null
        email: string
        active: boolean
    }
    appointments: any[]
}

interface PatientsTableProps {
    patients: Patient[]
}

export default function PatientsTable({ patients }: PatientsTableProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // CRUD States
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<any>(null)

    // Action States
    const [createState, createAction] = useActionState(adminCreatePatient, { message: '' })
    const [updateState, updateAction] = useActionState(adminUpdatePatient, { message: '' })
    const [deleteState, deleteAction] = useActionState(deletePatient, { message: '' })

    // Close modals on success
    useEffect(() => {
        if (createState.message === 'Success') setIsCreateOpen(false)
        if (updateState.message === 'Success') setIsEditOpen(false)
        if (deleteState.message === 'Success') setIsDeleteOpen(false)
    }, [createState, updateState, deleteState])

    // Reset pagination when search changes
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm])

    // Helper to calculate age
    const calculateAge = (birthDate: Date | null) => {
        if (!birthDate) return '-';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    const filteredPatients = patients.filter(patient => {
        const term = searchTerm.toLowerCase()
        const name = patient.user.name?.toLowerCase() || ''
        const email = patient.user.email.toLowerCase()
        const rut = patient.rut.toLowerCase()
        const commune = patient.commune.toLowerCase()

        return name.includes(term) || email.includes(term) || rut.includes(term) || commune.includes(term)
    })

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)

    const handleExport = () => {
        const dataToExport = filteredPatients.map(p => ({
            'Nombre': p.user.name,
            'Email': p.user.email,
            'RUT': p.rut,
            'Comuna': p.commune,
            'Edad': calculateAge(p.birthDate),
            'Estado': p.user.active ? 'Activo' : 'Inactivo',
            'Citas': p.appointments.length
        }))

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Pacientes")
        XLSX.writeFile(wb, `pacientes_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                {/* Search */}
                <div className="relative w-full sm:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-zinc-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-lg leading-5 bg-white text-zinc-900 placeholder-zinc-500 focus:outline-none focus:placeholder-zinc-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                        placeholder="Buscar por nombre, RUT, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Paciente
                    </button>
                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Exportar a Excel
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-zinc-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Paciente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">RUT</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Comuna</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Edad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Estado</th>

                            <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Citas</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-zinc-200">
                        {currentPatients.map((patient) => (
                            <tr key={patient.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                            {patient.user.name?.[0]}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-zinc-900">{patient.user.name}</div>
                                            <div className="text-sm text-zinc-500">{patient.user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{patient.rut}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{patient.commune}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{calculateAge(patient.birthDate)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {patient.user.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                    {patient.appointments.length}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link
                                            href={`/patients/${patient.id}/history`}
                                            className="p-1 text-zinc-600 hover:text-indigo-600 hover:bg-zinc-50 rounded bg-white border border-transparent hover:border-zinc-200"
                                            title="Historial Médico"
                                        >
                                            <History size={16} />
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setSelectedPatient(patient)
                                                setIsEditOpen(true)
                                            }}
                                            className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded bg-white border border-transparent hover:border-zinc-200"
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedPatient(patient)
                                                setIsDeleteOpen(true)
                                            }}
                                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded bg-white border border-transparent hover:border-zinc-200"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredPatients.length > 0 && (
                    <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-between bg-zinc-50">
                        <div className="text-sm text-zinc-500">
                            Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, filteredPatients.length)}</span> de <span className="font-medium">{filteredPatients.length}</span> resultados
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-zinc-300 rounded-md bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-zinc-300 rounded-md bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {filteredPatients.length === 0 && (
                    <div className="px-6 py-10 text-center text-zinc-500">
                        No se encontraron pacientes que coincidan con su búsqueda.
                    </div>
                )}
            </div>


            {/* CREATE MODAL */}
            {
                isCreateOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                                <h3 className="text-lg font-bold text-zinc-900">Nuevo Paciente</h3>
                                <button onClick={() => setIsCreateOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
                            </div>
                            <form action={createAction} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre Completo</label>
                                    <input name="name" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                                        <input name="email" type="email" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">RUT</label>
                                        <input name="rut" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" placeholder="11.111.111-1" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Dirección</label>
                                    <input name="address" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" placeholder="Ej: Av. Providencia 1234" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Comuna</label>
                                        <select name="commune" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none  text-zinc-900 bg-white">
                                            <option value="SANTIAGO">Santiago</option>
                                            <option value="MAIPU">Maipú</option>
                                            <option value="PROVIDENCIA">Providencia</option>
                                            <option value="LAS CONDES">Las Condes</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Género</label>
                                        <select name="gender" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 bg-white">
                                            <option value="">Seleccionar</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha de Nacimiento</label>
                                    <input name="birthDate" type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" />
                                </div>

                                {createState?.message && createState.message !== 'Success' && <p className="text-red-500 text-sm">{createState.message}</p>}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Crear Paciente</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* EDIT MODAL */}
            {
                isEditOpen && selectedPatient && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                                <h3 className="text-lg font-bold text-zinc-900">Editar Paciente</h3>
                                <button onClick={() => setIsEditOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X size={20} /></button>
                            </div>
                            <form action={updateAction} className="p-6 space-y-4">
                                <input type="hidden" name="id" value={selectedPatient.id} />
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre Completo</label>
                                    <input name="name" defaultValue={selectedPatient.user.name} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">RUT</label>
                                        <input name="rut" defaultValue={selectedPatient.rut} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Dirección</label>
                                        <input name="address" defaultValue={selectedPatient.address || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Comuna</label>
                                        <select name="commune" defaultValue={selectedPatient.commune} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 bg-white">
                                            <option value="SANTIAGO">Santiago</option>
                                            <option value="MAIPU">Maipú</option>
                                            <option value="PROVIDENCIA">Providencia</option>
                                            <option value="LAS CONDES">Las Condes</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Género</label>
                                        <select name="gender" defaultValue={selectedPatient.gender || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 bg-white">
                                            <option value="">Seleccionar</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha Nacimiento</label>
                                        <input
                                            name="birthDate"
                                            type="date"
                                            defaultValue={selectedPatient.birthDate ? new Date(selectedPatient.birthDate).toISOString().split('T')[0] : ''}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900"
                                        />
                                    </div>
                                </div>

                                {updateState?.message && updateState.message !== 'Success' && <p className="text-red-500 text-sm">{updateState.message}</p>}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Guardar Cambios</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* DELETE MODAL */}
            {
                isDeleteOpen && selectedPatient && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-zinc-100 overflow-hidden">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 mb-2">¿Eliminar Paciente?</h3>
                                <p className="text-zinc-500 text-sm mb-6">
                                    Estás a punto de eliminar a <strong>{selectedPatient.user.name}</strong>. Esta acción no se puede deshacer.
                                </p>

                                <form action={deleteAction} className="flex justify-center gap-3">
                                    <input type="hidden" name="id" value={selectedPatient.id} />
                                    <button type="button" onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg">Sí, Eliminar</button>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
