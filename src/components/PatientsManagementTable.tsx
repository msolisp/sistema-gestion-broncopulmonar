'use client'

import { useState, useEffect } from 'react'
import { Search, Edit2, Eye, EyeOff, X, Users } from 'lucide-react'
import { REGIONS } from '@/lib/chile-data'

interface Patient {
    id: string
    name: string
    rut: string
    email: string
    commune: string
    address: string
    active: boolean
    region?: string
    examCount?: number
}

export default function PatientsManagementTable() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
    const [formData, setFormData] = useState<any>({})
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const itemsPerPage = 15

    useEffect(() => {
        loadPatients()
    }, [])

    const loadPatients = async () => {
        try {
            const res = await fetch('/api/patients')
            if (res.ok) {
                const data = await res.json()
                setPatients(data)
            }
        } catch (error) {
            console.error('Error loading patients:', error)
        } finally {
            setLoading(false)
        }
    }

    const validatePassword = (pwd: string): string | null => {
        if (!pwd) return null
        if (pwd.length < 8) return 'Minimo 8 caracteres'
        if (!/[A-Z]/.test(pwd)) return 'Debe contener una mayuscula'
        if (!/[a-z]/.test(pwd)) return 'Debe contener una minuscula'
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) return 'Debe contener un caracter especial'
        return null
    }

    const passwordError = validatePassword(password)
    const isPasswordValid = !password || passwordError === null

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.rut.includes(searchTerm)
    )

    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage)

    const handleEdit = (patient: Patient) => {
        setEditingPatient(patient)
        setFormData({
            name: patient.name,
            region: patient.region || '',
            commune: patient.commune,
            address: patient.address,
        })
        setPassword('')
        setShowPassword(false)
        setSaveMessage(null)
    }

    const handleSave = async () => {
        if (!editingPatient) return
        if (!isPasswordValid) {
            setSaveMessage({ type: 'error', text: 'La contraseña no cumple los requisitos' })
            return
        }

        try {
            const payload = {
                id: editingPatient.id,
                ...formData,
                password: password || undefined
            }

            const res = await fetch('/api/patients/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                setSaveMessage({ type: 'success', text: 'Paciente actualizado correctamente' })
                await loadPatients()
                setTimeout(() => {
                    setEditingPatient(null)
                    setSaveMessage(null)
                }, 1500)
            } else {
                const error = await res.json()
                setSaveMessage({ type: 'error', text: error.message || 'Error al guardar' })
            }
        } catch (error) {
            setSaveMessage({ type: 'error', text: 'Error de conexion' })
        }
    }

    const selectedRegion = REGIONS.find(r => r.name === formData.region)

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-zinc-500">Cargando pacientes...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900">Gestion de Pacientes</h2>
                        <p className="text-sm text-zinc-500">{filteredPatients.length} pacientes registrados</p>
                    </div>
                </div>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o RUT..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
            </div>

            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200">
                        <thead className="bg-zinc-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">RUT</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Comuna</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Dirección</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Exámenes</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-zinc-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-zinc-200">
                            {currentPatients.map((patient) => (
                                <tr key={patient.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                                        {patient.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                                        {patient.rut}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                                        {patient.commune}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-600 max-w-xs truncate">
                                        {patient.address}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {patient.examCount && patient.examCount > 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                </svg>
                                                {patient.examCount}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-zinc-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${patient.active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {patient.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button
                                            onClick={() => handleEdit(patient)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Editar
                                        </button>
                                        <a
                                            href={`/patients/${patient.id}/history`}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors ml-2"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Historial
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-between">
                        <p className="text-sm text-zinc-500">
                            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredPatients.length)} de {filteredPatients.length}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Anterior
                            </button>
                            <span className="px-3 py-1 text-sm text-zinc-600">
                                Pagina {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {editingPatient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-bold text-zinc-900">Editar Paciente</h3>
                            <button
                                onClick={() => setEditingPatient(null)}
                                className="p-1 rounded-full hover:bg-zinc-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-zinc-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre Completo</label>
                                <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">RUT</label>
                                <input type="text" value={editingPatient.rut} disabled className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-zinc-50 text-zinc-500 cursor-not-allowed" />
                                <p className="text-xs text-zinc-500 mt-1">El RUT no puede ser modificado</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Region</label>
                                    <select value={formData.region || ''} onChange={(e) => setFormData({ ...formData, region: e.target.value, commune: '' })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Seleccionar</option>
                                        {REGIONS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Comuna</label>
                                    <select value={formData.commune || ''} onChange={(e) => setFormData({ ...formData, commune: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" disabled={!formData.region}>
                                        <option value="">Seleccionar</option>
                                        {selectedRegion?.communes.map((c) => <option key={c} value={c.toUpperCase()}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Direccion</label>
                                <input type="text" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Nueva Contraseña (opcional)</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Dejar vacio para no cambiar"
                                        className={`w-full pr-10 px-3 py-2 border rounded-lg focus:ring-2 outline-none ${passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:border-indigo-500 focus:ring-indigo-500'}`}
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {password && (
                                    <div className="mt-2 space-y-1 text-xs">
                                        <div className="flex items-center gap-1"><span className={password.length >= 8 ? 'text-green-600' : 'text-zinc-400'}>{password.length >= 8 ? '✓' : '○'}</span><span>Minimo 8 caracteres</span></div>
                                        <div className="flex items-center gap-1"><span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-zinc-400'}>{/[A-Z]/.test(password) ? '✓' : '○'}</span><span>Una mayuscula</span></div>
                                        <div className="flex items-center gap-1"><span className={/[a-z]/.test(password) ? 'text-green-600' : 'text-zinc-400'}>{/[a-z]/.test(password) ? '✓' : '○'}</span><span>Una minuscula</span></div>
                                        <div className="flex items-center gap-1"><span className={/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? 'text-green-600' : 'text-zinc-400'}>{/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) ? '✓' : '○'}</span><span>Un caracter especial</span></div>
                                    </div>
                                )}
                            </div>

                            {saveMessage && (
                                <div className={`p-3 rounded-lg text-sm ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {saveMessage.text}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-zinc-100 flex justify-end gap-3 bg-zinc-50">
                            <button onClick={() => setEditingPatient(null)} className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">Cancelar</button>
                            <button onClick={handleSave} disabled={!isPasswordValid} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
