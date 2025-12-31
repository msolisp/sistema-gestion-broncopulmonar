'use client'

import { useState } from "react"
import { Users, FileText, X, Check, Shield } from "lucide-react"

interface DashboardContentProps {
    patients: Array<{
        id: string;
        rut: string;
        commune: string;
        diagnosisDate: Date | null;
        user: { name: string | null; email: string };
    }>
}

type UserRole = 'ADMIN' | 'KINESIOLOGIST' | 'RECEPTIONIST' | 'PATIENT'

interface SystemUser {
    id: string
    name: string
    email: string
    role: UserRole
    active: boolean
}

function PermissionMatrix() {
    const [permissions, setPermissions] = useState([
        { action: 'Ver Pacientes', kine: true, recep: true },
        { action: 'Editar Pacientes', kine: true, recep: true },
        { action: 'Eliminar Pacientes', kine: true, recep: false },
        { action: 'Ver Reportes BI', kine: true, recep: false },
        { action: 'Gestionar Usuarios', kine: false, recep: false },
        { action: 'Configuración Global', kine: false, recep: false },
    ])

    const togglePermission = (index: number, role: 'kine' | 'recep') => {
        const newPermissions = [...permissions]
        newPermissions[index][role] = !newPermissions[index][role]
        setPermissions(newPermissions)
    }

    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-zinc-100">
                    <th className="text-left py-3 px-4 text-zinc-500">Recurso / Acción</th>
                    <th className="text-center py-3 px-4 text-blue-700">KINESIÓLOGO</th>
                    <th className="text-center py-3 px-4 text-orange-700">RECEPCIONISTA</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
                {permissions.map((p, i) => (
                    <tr key={i} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-zinc-700">{p.action}</td>

                        <td className="text-center py-3">
                            <button
                                onClick={() => togglePermission(i, 'kine')}
                                className={`w-4 h-4 rounded-full transition-colors ${p.kine ? 'bg-green-500 hover:bg-green-600' : 'bg-zinc-200 hover:bg-zinc-300'}`}
                            />
                        </td>
                        <td className="text-center py-3">
                            <button
                                onClick={() => togglePermission(i, 'recep')}
                                className={`w-4 h-4 rounded-full transition-colors ${p.recep ? 'bg-green-500 hover:bg-green-600' : 'bg-zinc-200 hover:bg-zinc-300'}`}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export default function DashboardContent({ patients }: DashboardContentProps) {
    const [activeTab, setActiveTab] = useState('Usuarios y Roles')

    // User Management State
    const [users, setUsers] = useState<SystemUser[]>([
        { id: '1', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN', active: true },
        { id: '2', name: 'Juan Kine', email: 'kine@test.com', role: 'KINESIOLOGIST', active: false },
        { id: '3', name: 'Maria Recepción', email: 'recep@test.com', role: 'RECEPTIONIST', active: true }
    ])
    const [isUserModalOpen, setIsUserModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
    const [formData, setFormData] = useState<Partial<SystemUser>>({})

    const handleCreateUser = () => {
        setEditingUser(null)
        setFormData({ name: '', email: '', role: 'KINESIOLOGIST', active: true })
        setIsUserModalOpen(true)
    }

    const handleEditUser = (user: SystemUser) => {
        setEditingUser(user)
        setFormData({ ...user })
        setIsUserModalOpen(true)
    }

    const handleSaveUser = () => {
        if (editingUser) {
            // Update
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } as SystemUser : u))
        } else {
            // Create
            const newUser: SystemUser = {
                id: Math.random().toString(36).substr(2, 9),
                name: formData.name || 'Nuevo Usuario',
                email: formData.email || '',
                role: formData.role || 'KINESIOLOGIST',
                active: formData.active ?? true
            }
            setUsers([...users, newUser])
        }
        setIsUserModalOpen(false)
    }

    return (
        <div className="space-y-8 relative">
            {/* User Modal */}
            {isUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                            <h3 className="font-bold text-zinc-900">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                            <button onClick={() => setIsUserModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="userName" className="block text-xs font-medium text-zinc-700 mb-1">Nombre Completo</label>
                                <input
                                    id="userName"
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="userEmail" className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
                                <input
                                    id="userEmail"
                                    type="email"
                                    value={formData.email || ''}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-700 mb-1">Rol</label>
                                <select
                                    value={formData.role || 'KINESIOLOGIST'}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="ADMIN">ADMINISTRADOR</option>
                                    <option value="KINESIOLOGIST">KINESIÓLOGO</option>
                                    <option value="RECEPTIONIST">RECEPCIONISTA</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="activeUser"
                                    checked={formData.active}
                                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="activeUser" className="text-sm text-zinc-700">Usuario Activo</label>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-zinc-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsUserModalOpen(false)}
                                className="px-4 py-2 text-sm text-zinc-600 font-medium hover:text-zinc-900"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveUser}
                                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg font-medium hover:bg-indigo-700 shadow-sm shadow-indigo-200"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Bar with Tabs */}
            <div className="border-b border-zinc-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
                    <h1 className="text-3xl font-bold text-sky-900">Administración Central</h1>

                    <nav className="flex space-x-6 overflow-x-auto">
                        {['Usuarios y Roles', 'Tablas Maestras', 'Seguridad - Control de acceso', 'Auditoría'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-sky-600 text-sky-700'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content Area based on Active Tab */}
            <div className="animate-in fade-in duration-300">

                {activeTab === 'Usuarios y Roles' && (
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                            <h3 className="font-bold text-zinc-700">Gestión de Usuarios</h3>
                            <button
                                onClick={handleCreateUser}
                                className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
                            >
                                <span>+</span> Nuevo Usuario
                            </button>
                        </div>
                        <div className="p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-100">
                                    <tr>
                                        <th className="px-6 py-3">Usuario</th>
                                        <th className="px-6 py-3">Email</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Estado</th>
                                        <th className="px-6 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-zinc-50/50">
                                            <td className="px-6 py-4 font-medium text-zinc-900">{user.name}</td>
                                            <td className="px-6 py-4 text-zinc-500">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                    user.role === 'KINESIOLOGIST' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {user.role === 'ADMIN' ? 'ADMINISTRADOR' :
                                                        user.role === 'KINESIOLOGIST' ? 'KINESIÓLOGO' :
                                                            user.role === 'RECEPTIONIST' ? 'RECEPCIONISTA' : user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.active ? (
                                                    <span className="text-green-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" /> Activo</span>
                                                ) : (
                                                    <span className="text-zinc-400 font-medium">Inactivo</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
                                                >
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'Tablas Maestras' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['Comunas', 'Previsiones', 'Diagnósticos CIE-10', 'Medicamentos', 'Insumos', 'Feriados'].map((item) => (
                            <div key={item} className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 hover:border-indigo-300 transition-colors cursor-pointer group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs text-zinc-400 font-medium">124 registros</span>
                                </div>
                                <h3 className="font-bold text-zinc-800 group-hover:text-indigo-700">{item}</h3>
                                <p className="text-xs text-zinc-500 mt-2">Gestionar catálogo de {item.toLowerCase()}.</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'Seguridad - Control de acceso' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
                            <h3 className="text-lg font-bold text-zinc-800 mb-4">Matriz de Permisos</h3>
                            <div className="overflow-x-auto">
                                <PermissionMatrix />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Auditoría' && (
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50">
                            <h3 className="font-bold text-zinc-700">Logs de Sistema (Últimas 24h)</h3>
                        </div>
                        <div className="divide-y divide-zinc-100">
                            {[
                                { user: 'admin@test.com', action: 'LOGIN_SUCCESS', ip: '192.168.1.10', time: '10:42 AM' },
                                { user: 'kine@test.com', action: 'VIEW_PATIENT_RECORD', ip: '192.168.1.15', time: '10:30 AM' },
                                { user: 'admin@test.com', action: 'UPDATE_SYSTEM_CONFIG', ip: '192.168.1.10', time: '09:15 AM' },
                                { user: 'unknown', action: 'LOGIN_FAILURE', ip: '186.42.12.1', time: '08:55 AM' },
                            ].map((log, i) => (
                                <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-zinc-50 text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${log.action.includes('FAILURE') ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                        <span className="font-mono text-zinc-600">{log.time}</span>
                                        <span className="font-medium text-zinc-900">{log.action}</span>
                                    </div>
                                    <div className="flex gap-4 text-zinc-500 text-xs">
                                        <span>User: {log.user}</span>
                                        <span>IP: {log.ip}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
