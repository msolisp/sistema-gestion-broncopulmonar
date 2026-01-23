'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Edit, Trash2, X } from 'lucide-react'
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
    const itemsPerPage = 10

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
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        Exportar Excel
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Nuevo
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-50 border-b">
                        <tr>
                            {columns.map(col => (
                                <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase">
                                    {col.label}
                                </th>
                            ))}
                            <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {currentItems.map((item) => (
                            <tr key={item.id} className="hover:bg-zinc-50">
                                {columns.map(col => (
                                    <td key={col.key} className="px-4 py-3">
                                        {col.type === 'date' && item[col.key]
                                            ? new Date(item[col.key]).toLocaleDateString()
                                            : item[col.key] || '-'
                                        }
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => {
                                            setSelectedItem(item)
                                            setIsEditOpen(true)
                                        }}
                                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t flex items-center justify-between">
                        <div className="text-sm text-zinc-500">
                            Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredData.length)} de {filteredData.length}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border rounded disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-lg">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="font-bold">Nuevo {title}</h3>
                            <button onClick={() => setIsCreateOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {columns.filter(c => c.key !== 'id' && c.key !== 'createdAt' && c.key !== 'updatedAt').map(col => (
                                <div key={col.key}>
                                    <label className="block text-sm font-medium mb-1">{col.label}</label>
                                    {col.type === 'select' ? (
                                        <select name={col.key} required={col.required} className="w-full px-3 py-2 border rounded-lg">
                                            <option value="">Seleccionar</option>
                                            {col.options?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : col.type === 'date' ? (
                                        <input name={col.key} type="date" required={col.required} className="w-full px-3 py-2 border rounded-lg" />
                                    ) : (
                                        <input name={col.key} type="text" required={col.required} className="w-full px-3 py-2 border rounded-lg" />
                                    )}
                                </div>
                            ))}
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 rounded-lg hover:bg-zinc-100">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditOpen && selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl w-full max-w-lg">
                        <div className="px-6 py-4 border-b flex justify-between items-center">
                            <h3 className="font-bold">Editar {title}</h3>
                            <button onClick={() => setIsEditOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            {columns.filter(c => c.key !== 'id' && c.key !== 'createdAt' && c.key !== 'updatedAt').map(col => (
                                <div key={col.key}>
                                    <label className="block text-sm font-medium mb-1">{col.label}</label>
                                    {col.type === 'select' ? (
                                        <select name={col.key} defaultValue={selectedItem[col.key]} required={col.required} className="w-full px-3 py-2 border rounded-lg">
                                            <option value="">Seleccionar</option>
                                            {col.options?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : col.type === 'date' ? (
                                        <input
                                            name={col.key}
                                            type="date"
                                            defaultValue={selectedItem[col.key] ? new Date(selectedItem[col.key]).toISOString().split('T')[0] : ''}
                                            required={col.required}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    ) : (
                                        <input name={col.key} type="text" defaultValue={selectedItem[col.key]} required={col.required} className="w-full px-3 py-2 border rounded-lg" />
                                    )}
                                </div>
                            ))}
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="activo" id="activo" defaultChecked={selectedItem.activo} className="rounded" />
                                <label htmlFor="activo" className="text-sm">Activo</label>
                            </div>
                            <div className="flex justify-between gap-3 pt-4">
                                <button type="button" onClick={handleDelete} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    Eliminar
                                </button>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 rounded-lg hover:bg-zinc-100">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                        Guardar
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
