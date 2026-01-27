'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Download, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Column {
    key: string
    label: string
    type?: 'text' | 'select' | 'date'
    options?: string[]
    required?: boolean
}

interface MasterTableManagerProps {
    title: string
    data: any[]
    columns: Column[]
    onRefresh: () => void
    onCreate: (formData: FormData) => Promise<{ message: string }>
    onUpdate: (formData: FormData) => Promise<{ message: string }>
    onDelete: (id: string) => Promise<{ message: string }>
}

export default function MasterTableManager({
    title,
    data,
    columns,
    onRefresh,
    onCreate,
    onUpdate,
    onDelete
}: MasterTableManagerProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8 // Reduced for better breathing room

    const filteredData = data.filter(item => {
        const term = searchTerm.toLowerCase()
        return Object.values(item).some(val =>
            String(val).toLowerCase().includes(term)
        )
    })

    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const result = await onCreate(formData)
        if (result.message === 'Success') {
            setIsCreateOpen(false)
            onRefresh()
        }
    }

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        formData.append('id', selectedItem.id)
        const result = await onUpdate(formData)
        if (result.message === 'Success') {
            setIsEditOpen(false)
            onRefresh()
        }
    }

    const handleDelete = async () => {
        if (confirm('¿Estás seguro de eliminar este registro?')) {
            await onDelete(selectedItem.id)
            setIsEditOpen(false)
            onRefresh()
        }
    }

    const handleExport = () => {
        const dataToExport = filteredData.map(item => {
            const obj: any = {}
            columns.forEach(col => {
                obj[col.label] = item[col.key]
            })
            return obj
        })

        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, title)
        XLSX.writeFile(wb, `${title}_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">{title}</h2>
                    <p className="text-sm text-zinc-500 mt-1">Gestión y administración de registros maestros</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleExport}
                        disabled={filteredData.length === 0}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-sm font-medium rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Exportar</span>
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Registro</span>
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-zinc-200">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-zinc-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar en todos los campos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg text-sm bg-transparent focus:ring-0 text-zinc-900 placeholder-zinc-400"
                    />
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50/50 border-b border-zinc-200">
                            <tr>
                                {columns.map(col => (
                                    <th key={col.key} className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                        {col.label}
                                    </th>
                                ))}
                                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {currentItems.length > 0 ? (
                                currentItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="group hover:bg-zinc-50/80 transition-colors duration-200"
                                    >
                                        {columns.map(col => (
                                            <td key={col.key} className="px-6 py-4 text-zinc-700 whitespace-nowrap">
                                                {col.type === 'date' && item[col.key]
                                                    ? new Date(item[col.key]).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
                                                    : item[col.key] || <span className="text-zinc-400 italic">No definido</span>
                                                }
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedItem(item)
                                                    setIsEditOpen(true)
                                                }}
                                                className="inline-flex items-center justify-center p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Editar registro"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-zinc-400">
                                            <Search className="w-8 h-8 mb-3 opacity-20" />
                                            <p className="text-sm">No se encontraron resultados para "{searchTerm}"</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/30 flex items-center justify-between">
                        <span className="text-xs text-zinc-500 font-medium">
                            Página {currentPage} de {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border border-zinc-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronLeft className="w-4 h-4 text-zinc-600" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-zinc-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                            >
                                <ChevronRight className="w-4 h-4 text-zinc-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Backdrop */}
            {(isCreateOpen || isEditOpen) && (
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                            <h3 className="text-lg font-semibold text-zinc-900">
                                {isCreateOpen ? 'Crear Nuevo Registro' : 'Editar Registro'}
                            </h3>
                            <button
                                onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}
                                className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={isCreateOpen ? handleCreate : handleUpdate}>
                            <div className="p-6 space-y-5">
                                {columns.filter(c => c.key !== 'id' && c.key !== 'createdAt' && c.key !== 'updatedAt').map(col => (
                                    <div key={col.key} className="space-y-1.5">
                                        <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                                            {col.label} {col.required && <span className="text-red-500">*</span>}
                                        </label>
                                        {col.type === 'select' ? (
                                            <div className="relative">
                                                <select
                                                    name={col.key}
                                                    defaultValue={isEditOpen ? selectedItem[col.key] : ''}
                                                    required={col.required}
                                                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all appearance-none"
                                                >
                                                    <option value="">Seleccionar opción...</option>
                                                    {col.options?.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <ChevronRight className="w-4 h-4 text-zinc-400 rotate-90" />
                                                </div>
                                            </div>
                                        ) : col.type === 'date' ? (
                                            <input
                                                name={col.key}
                                                type="date"
                                                defaultValue={isEditOpen && selectedItem[col.key] ? new Date(selectedItem[col.key]).toISOString().split('T')[0] : ''}
                                                required={col.required}
                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                                            />
                                        ) : (
                                            <input
                                                name={col.key}
                                                type="text"
                                                defaultValue={isEditOpen ? selectedItem[col.key] : ''}
                                                required={col.required}
                                                placeholder={`Ingrese ${col.label.toLowerCase()}...`}
                                                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                                            />
                                        )}
                                    </div>
                                ))}

                                {isEditOpen && (
                                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                        <input type="checkbox" name="activo" id="activo" defaultChecked={selectedItem.activo} className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
                                        <label htmlFor="activo" className="text-sm font-medium text-zinc-700 cursor-pointer select-none">
                                            Registro Activo
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex justify-between items-center">
                                {isEditOpen ? (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-2 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Eliminar
                                    </button>
                                ) : <div />} {/* Spacer */}

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}
                                        className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 shadow-sm hover:shadow transition-all flex items-center gap-2"
                                    >
                                        {isEditOpen ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                        {isEditOpen ? 'Guardar Cambios' : 'Crear Registro'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
