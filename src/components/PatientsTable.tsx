'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'
import { Search, Download, FileSpreadsheet, Plus, Edit, Trash2, X, UserCheck, History, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { adminCreatePatient, adminUpdatePatient, deletePatient } from "@/lib/actions"

interface Patient {
    id: string
    commune: string
    region: string | null

    diagnosisDate: Date | null
    gender: string | null
    address: string | null
    birthDate: Date | null
    name: string | null
    email: string
    active: boolean
    rut: string | null
    appointments: any[]
}

interface Region {
    name: string
    communes: string[]
}

interface PatientsTableProps {
    patients: Patient[]
}

export default function PatientsTable({ patients }: PatientsTableProps) {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [regions, setRegions] = useState<Region[]>([])
    const [loadingRegions, setLoadingRegions] = useState(true)
    const itemsPerPage = 10

    // CRUD States
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<any>(null)

    // Form States
    const [createRegion, setCreateRegion] = useState('')
    const [editRegion, setEditRegion] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // Action States
    const [createState, createAction] = useActionState(adminCreatePatient, { message: '' })
    const [updateState, updateAction] = useActionState(adminUpdatePatient, { message: '' })
    const [deleteState, deleteAction] = useActionState(deletePatient, { message: '' })

    // Load regions from API
    useEffect(() => {
        const loadRegions = async () => {
            try {
                const res = await fetch('/api/master-tables/regions')
                if (res.ok) {
                    const data = await res.json()
                    setRegions(data)
                }
            } catch (error) {
                console.error('Error loading regions:', error)
            } finally {
                setLoadingRegions(false)
            }
        }
        loadRegions()
    }, [])

    // Initialize Edit Region when opening modal
    useEffect(() => {
        if (isEditOpen && selectedPatient) {
            setEditRegion(selectedPatient.region || '')
            setShowPassword(false) // Reset password visibility
        }
    }, [isEditOpen, selectedPatient])

    // Close modals on success
    useEffect(() => {
        if (createState.message === 'Success') {
            setIsCreateOpen(false)
            router.refresh()
        }
        if (updateState.message === 'Success') {
            setIsEditOpen(false)
            router.refresh()
        }
        if (deleteState.message === 'Success') {
            setIsDeleteOpen(false)
            router.refresh()
        }
    }, [createState, updateState, deleteState, router])

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
        const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

        const term = normalize(searchTerm)
        const name = normalize(patient.name || '')
        const email = normalize(patient.email)
        const rut = normalize(patient.rut || '')
        const commune = normalize(patient.commune)

        return name.includes(term) || email.includes(term) || rut.includes(term) || commune.includes(term)
    })

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentPatients = filteredPatients.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)

    const handleExport = () => {
        const dataToExport = filteredPatients.map(p => ({
            'Nombre': p.name,
            'Email': p.email,
            'RUT': p.rut,
            'Región': p.region,
            'Comuna': p.commune,
            'Edad': calculateAge(p.birthDate),
            'Estado': p.active ? 'Activo' : 'Inactivo',
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
                                            {patient.name?.[0]}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-zinc-900">{patient.name}</div>
                                            <div className="text-sm text-zinc-500">{patient.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{patient.rut}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{patient.commune}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{calculateAge(patient.birthDate)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {patient.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                    {patient.appointments.length}
                                </td>
                                <td className="text-center py-3">
                                    <div className="flex justify-center gap-2">
                                        <Link
                                            href={`/patients/${patient.id}/history`}
                                            className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded bg-white border border-transparent hover:border-zinc-200"
                                            title="Ver Historial"
                                        >
                                            <History size={16} />
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setSelectedPatient(patient)
                                                setIsEditOpen(true)
                                            }}
                                            className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded bg-white border border-transparent hover:border-zinc-200"
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
                                aria-label="Página Anterior"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-zinc-300 rounded-md bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Página Siguiente"
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
                            <form action={createAction} className="p-6 space-y-4" autoComplete="off">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre Completo</label>
                                    <input name="name" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" autoComplete="off" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">RUT</label>
                                            <input
                                                id="rut_num"
                                                type="text"
                                                maxLength={8}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900"
                                                placeholder="11111111"
                                                autoComplete="off"
                                                onChange={(e) => {
                                                    const num = e.target.value.replace(/[^0-9]/g, '');
                                                    const dv = (document.getElementById('rut_dv') as HTMLInputElement).value;
                                                    (document.getElementById('rut_hidden') as HTMLInputElement).value = num && dv ? `${num}-${dv}` : '';
                                                }}
                                            />
                                        </div>
                                        <div className="w-20">
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">DV</label>
                                            <input
                                                id="rut_dv"
                                                type="text"
                                                maxLength={1}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 text-center uppercase"
                                                placeholder="K"
                                                autoComplete="off"
                                                onChange={(e) => {
                                                    const dv = e.target.value.toUpperCase().replace(/[^0-9K]/g, '');
                                                    const num = (document.getElementById('rut_num') as HTMLInputElement).value;
                                                    (document.getElementById('rut_hidden') as HTMLInputElement).value = num && dv ? `${num}-${dv}` : '';
                                                }}
                                            />
                                        </div>
                                        <input type="hidden" name="rut" id="rut_hidden" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                                        <input name="email" type="email" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" autoComplete="new-password" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Contraseña</label>
                                    <div className="relative">
                                        <input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 pr-10"
                                            placeholder="********"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-1">
                                        <label htmlFor="create_region" className="block text-sm font-medium text-zinc-700 mb-1">Región</label>
                                        <select
                                            id="create_region"
                                            name="region"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 bg-white"
                                            onChange={(e) => setCreateRegion(e.target.value)}
                                            defaultValue=""
                                            disabled={loadingRegions}
                                        >
                                            <option value="">{loadingRegions ? 'Cargando...' : 'Seleccionar'}</option>
                                            {regions.map(r => (
                                                <option key={r.name} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-1">
                                        <label htmlFor="create_commune" className="block text-sm font-medium text-zinc-700 mb-1">Comuna</label>
                                        <select
                                            id="create_commune"
                                            name="commune"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none  text-zinc-900 bg-white"
                                            disabled={!createRegion || loadingRegions}
                                        >
                                            <option value="">Seleccionar</option>
                                            {createRegion && regions.find(r => r.name === createRegion)?.communes.map(c => (
                                                <option key={c} value={c.toUpperCase()}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Dirección</label>
                                    <input name="address" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" placeholder="Ej: Av. Providencia 1234" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Género</label>
                                        <select name="gender" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 bg-white">
                                            <option value="">Seleccionar</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Fecha de Nacimiento</label>
                                        <input name="birthDate" type="date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" />
                                    </div>
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
                                    <input name="name" defaultValue={selectedPatient.name} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">RUT</label>
                                            <input
                                                id="edit_rut_num"
                                                type="text"
                                                maxLength={8}
                                                defaultValue={selectedPatient.rut?.split('-')[0] || ''}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900"
                                                placeholder="11111111"
                                                autoComplete="off"
                                                onChange={(e) => {
                                                    const num = e.target.value.replace(/[^0-9]/g, '');
                                                    const dv = (document.getElementById('edit_rut_dv') as HTMLInputElement).value;
                                                    const rutInput = document.querySelector('input[name="rut"]') as HTMLInputElement;
                                                    if (rutInput) {
                                                        rutInput.value = num && dv ? `${num}-${dv}` : '';
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="w-20">
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">DV</label>
                                            <input
                                                id="edit_rut_dv"
                                                type="text"
                                                maxLength={1}
                                                defaultValue={selectedPatient.rut?.split('-')[1] || ''}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 text-center uppercase"
                                                placeholder="K"
                                                autoComplete="off"
                                                onChange={(e) => {
                                                    const dv = e.target.value.toUpperCase().replace(/[^0-9K]/g, '');
                                                    const num = (document.getElementById('edit_rut_num') as HTMLInputElement).value;
                                                    const rutInput = document.querySelector('input[name="rut"]') as HTMLInputElement;
                                                    if (rutInput) {
                                                        rutInput.value = num && dv ? `${num}-${dv}` : '';
                                                    }
                                                }}
                                            />
                                        </div>
                                        <input type="hidden" name="rut" defaultValue={selectedPatient.rut || ''} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                                        <input name="email" type="email" defaultValue={selectedPatient.email} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" autoComplete="new-password" />
                                    </div>
                                    <div className="col-span-2">
                                        <label htmlFor="edit_password" className="block text-sm font-medium text-zinc-700 mb-1">Nueva Contraseña (opcional)</label>
                                        <div className="relative">
                                            <input
                                                id="edit_password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 pr-10"
                                                placeholder="Dejar vacio para no cambiar"
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Dirección</label>
                                        <input name="address" defaultValue={selectedPatient.address || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900" />
                                    </div>
                                    <div>
                                        <label htmlFor="edit_region" className="block text-sm font-medium text-zinc-700 mb-1">Región</label>
                                        <select
                                            id="edit_region"
                                            name="region"
                                            defaultValue={selectedPatient.region}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 bg-white"
                                            onChange={(e) => setEditRegion(e.target.value)}
                                            disabled={loadingRegions}
                                        >
                                            <option value="">{loadingRegions ? 'Cargando...' : 'Seleccionar'}</option>
                                            {regions.map(r => (
                                                <option key={r.name} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="edit_commune" className="block text-sm font-medium text-zinc-700 mb-1">Comuna</label>
                                        <select
                                            id="edit_commune"
                                            name="commune"
                                            defaultValue={selectedPatient.commune?.toUpperCase()}
                                            key={`${selectedPatient.id}-${editRegion}`}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 bg-white"
                                            disabled={!editRegion || loadingRegions}
                                        >
                                            <option value="">Seleccionar</option>
                                            {editRegion && regions.find(r => r.name === editRegion)?.communes.map(c => (
                                                <option key={c} value={c.toUpperCase()}>{c}</option>
                                            ))}
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


                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        name="active"
                                        id="active"
                                        defaultChecked={selectedPatient.active}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-zinc-300 rounded"
                                    />
                                    <label htmlFor="active" className="text-sm font-medium text-zinc-700 select-none cursor-pointer">
                                        Paciente Activo
                                    </label>
                                </div>

                                {updateState?.message && updateState.message !== 'Success' && <p className="text-red-500 text-sm">{updateState.message}</p>}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Guardar Cambios</button>
                                </div>
                            </form>
                        </div>
                    </div >
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
                                    Estás a punto de eliminar a <strong>{selectedPatient.name}</strong>. Esta acción no se puede deshacer.
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
