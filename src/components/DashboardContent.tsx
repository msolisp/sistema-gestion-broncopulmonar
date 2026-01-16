'use client'

import { useState, useEffect } from "react"
import { Users, FileText, X, Check, Shield, Eye, EyeOff } from "lucide-react"

import { adminCreateSystemUser, adminUpdateSystemUser, toggleRolePermission, seedPermissions, adminDeleteSystemUser } from "@/lib/actions";
import { useRouter, useSearchParams } from "next/navigation";
import PatientsManagementTable from './PatientsManagementTable'
import AppointmentCalendar from './AppointmentCalendar'
import PendingExamsWidget from './PendingExamsWidget'

interface DashboardContentProps {

    initialUsers: Array<{
        id: string;
        name: string | null;
        email: string;
        role: string;
        active: boolean;
    }>;
    logs: Array<{
        id: string;
        action: string;
        details: string | null;
        userEmail: string | null;
        ipAddress: string | null;
        createdAt: string;
    }>;
    initialPermissions: Array<{
        action: string;
        kine: boolean;
        recep: boolean;
    }>;
    appointments: Array<{
        id: string;
        date: string;
        status: string;
        notes: string | null;
        patient: {
            name: string | null;
            email: string;
            rut: string | null;
        }
    }>;
    pendingExams: Array<{
        id: string;
        fileName: string | null;
        fileUrl: string;
        examDate: string;
        patient: {
            id: string;
            name: string
            rut: string
        }
    }>;
}

type UserRole = 'ADMIN' | 'KINESIOLOGIST' | 'RECEPTIONIST' | 'PATIENT'

interface SystemUser {
    id: string
    name: string | null
    email: string
    role: UserRole
    active: boolean
}

// PermissionMatrix Restored
function PermissionMatrix({ initialData }: { initialData: any[] }) {
    const [permissions, setPermissions] = useState(initialData);

    const togglePermission = async (index: number, role: 'kine' | 'recep') => {
        const newPermissions = [...permissions];
        const perm = newPermissions[index];
        const newValue = !perm[role];

        // Optimistic UI Update
        newPermissions[index] = { ...perm, [role]: newValue };
        setPermissions(newPermissions);

        // Server Action
        const roleName = role === 'kine' ? 'KINESIOLOGIST' : 'RECEPTIONIST';
        const res = await toggleRolePermission(roleName, perm.action, newValue);

        if (res?.message !== 'Success') {
            // Revert on failure
            newPermissions[index] = { ...perm, [role]: !newValue };
            setPermissions([...newPermissions]);
            alert('Error al actualizar permiso');
        }
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
                {permissions?.map((p, i) => (
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

export default function DashboardContent({ initialUsers, logs, initialPermissions, appointments = [], pendingExams = [] }: DashboardContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams()
    const tabFromUrl = searchParams.get('tab')
    const [activeTab, setActiveTab] = useState(tabFromUrl || 'Gestión de Pacientes')

    // Update activeTab when URL changes
    useEffect(() => {
        if (tabFromUrl) {
            setActiveTab(tabFromUrl)
        }
    }, [tabFromUrl])

    // User Management State - Initialize with Real Data
    // Filter out potential conflicts if needed, but assuming server data is truth
    const [users, setUsers] = useState<SystemUser[]>(initialUsers as SystemUser[]);

    // Sync state when props change (router.refresh())
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setUsers(initialUsers as SystemUser[]);
    }, [initialUsers]);

    const [isUserModalOpen, setIsUserModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
    const [formData, setFormData] = useState<Partial<SystemUser>>({})
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [permissionFeedback, setPermissionFeedback] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleCreateUser = () => {
        setEditingUser(null)
        setFormData({ name: '', email: '', role: 'KINESIOLOGIST', active: true })
        setPassword('');
        setPasswordError(null);
        setShowPassword(false);
        setSaveFeedback(null);
        setIsUserModalOpen(true)
    }

    const handleEditUser = (user: SystemUser) => {
        setEditingUser(user)
        setFormData({ ...user })
        setPassword(''); // No pre-fill password for security
        setPasswordError(null);
        setShowPassword(false);
        setSaveFeedback(null);
        setIsUserModalOpen(true)
    }

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) {
            return 'La contraseña debe tener al menos 8 caracteres';
        }
        if (!/[A-Z]/.test(pwd)) {
            return 'Debe contener al menos una mayúscula';
        }
        if (!/[a-z]/.test(pwd)) {
            return 'Debe contener al menos una minúscula';
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
            return 'Debe contener al menos un carácter especial';
        }
        return null;
    };

    const handleSaveUser = async () => {
        // Validate password for new users
        if (!editingUser) {
            const pwdError = validatePassword(password);
            if (pwdError) {
                setPasswordError(pwdError);
                return;
            }
        }

        setIsSubmitting(true);
        const data = new FormData();
        data.append('name', formData.name || '');
        data.append('email', formData.email || '');
        data.append('role', formData.role || 'KINESIOLOGIST');
        if (formData.active) data.append('active', 'on');

        // Add password
        if (!editingUser) {
            data.append('password', password);
        } else if (password) {
            // If editing and password is provided, validate it
            const pwdError = validatePassword(password);
            if (pwdError) {
                setPasswordError(pwdError);
                setIsSubmitting(false);
                return;
            }
            data.append('password', password);
        }

        let res;
        if (editingUser) {
            data.append('id', editingUser.id);
            res = await adminUpdateSystemUser(null, data);
        } else {
            res = await adminCreateSystemUser(null, data);
        }

        setIsSubmitting(false);

        if (res?.message === 'Success') {
            setIsUserModalOpen(false);
            setPassword('');
            setPasswordError(null);
            setSaveFeedback(null);
            router.refresh();
        } else {
            setSaveFeedback({ type: 'error', message: res?.message || 'Error al guardar usuario' });
        }
    }

    const handleDeleteUser = async (user: SystemUser) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar al usuario ${user.name}?`)) return;

        const res = await adminDeleteSystemUser(user.id);
        if (res?.message === 'Success') {
            router.refresh();
        } else {
            alert(res?.message || 'Error al eliminar usuario');
        }
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
                                    autoComplete="off"
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
                                    autoComplete="off"
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label htmlFor="userPassword" className="block text-xs font-medium text-zinc-700 mb-1">
                                    Contraseña {editingUser && <span className="text-zinc-400">(dejar vacío para mantener actual)</span>}
                                </label>
                                <div className="relative">
                                    <input
                                        id="userPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => {
                                            setPassword(e.target.value);
                                            if (e.target.value) {
                                                setPasswordError(validatePassword(e.target.value));
                                            } else {
                                                setPasswordError(null);
                                            }
                                        }}
                                        autoComplete="new-password"
                                        className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm text-zinc-900 focus:ring-2 outline-none ${passwordError ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:ring-indigo-500'
                                            }`}
                                        placeholder={editingUser ? "Dejar vacío para no cambiar" : "Mínimo 8 caracteres"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {passwordError && (
                                    <p className="text-xs text-red-600 mt-1">{passwordError}</p>
                                )}
                                {!editingUser && (
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs font-medium text-zinc-600">Requisitos:</p>
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className={password.length >= 8 ? 'text-green-600' : 'text-zinc-400'}>
                                                {password.length >= 8 ? '✓' : '○'}
                                            </span>
                                            <span className={password.length >= 8 ? 'text-zinc-700' : 'text-zinc-500'}>
                                                Mínimo 8 caracteres
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-zinc-400'}>
                                                {/[A-Z]/.test(password) ? '✓' : '○'}
                                            </span>
                                            <span className={/[A-Z]/.test(password) ? 'text-zinc-700' : 'text-zinc-500'}>
                                                Una mayúscula
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className={/[a-z]/.test(password) ? 'text-green-600' : 'text-zinc-400'}>
                                                {/[a-z]/.test(password) ? '✓' : '○'}
                                            </span>
                                            <span className={/[a-z]/.test(password) ? 'text-zinc-700' : 'text-zinc-500'}>
                                                Una minúscula
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-600' : 'text-zinc-400'}>
                                                {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✓' : '○'}
                                            </span>
                                            <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-zinc-700' : 'text-zinc-500'}>
                                                Un carácter especial
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label htmlFor="userRole" className="block text-xs font-medium text-zinc-700 mb-1">Rol</label>
                                <select
                                    id="userRole"
                                    value={formData.role || 'KINESIOLOGIST'}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    disabled={editingUser?.role === 'ADMIN'}
                                    className={`w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none ${editingUser?.role === 'ADMIN' ? 'bg-zinc-100 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {editingUser?.role === 'ADMIN' && <option value="ADMIN">ADMINISTRADOR</option>}
                                    <option value="KINESIOLOGIST">KINESIÓLOGO</option>
                                    <option value="RECEPTIONIST">RECEPCIONISTA</option>
                                </select>
                                {editingUser?.role === 'ADMIN' && (
                                    <p className="text-xs text-zinc-500 mt-1">El rol de administrador no puede ser modificado</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="activeUser"
                                    checked={formData.active}
                                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                    disabled={editingUser?.role === 'ADMIN'}
                                    className={`rounded text-indigo-600 focus:ring-indigo-500 ${editingUser?.role === 'ADMIN' ? 'cursor-not-allowed opacity-50' : ''
                                        }`}
                                />
                                <label htmlFor="activeUser" className="text-sm text-zinc-700">Usuario Activo</label>
                                {editingUser?.role === 'ADMIN' && (
                                    <span className="text-xs text-zinc-500">(No se puede desactivar admin)</span>
                                )}
                            </div>
                        </div>
                        {saveFeedback && (
                            <div className={`mx-6 mb-4 p-3 rounded-lg text-sm font-medium ${saveFeedback.type === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                                }`}>
                                {saveFeedback.message}
                            </div>
                        )}
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
                        {['Gestión de Pacientes', 'Usuarios y Roles', 'Tablas Maestras', 'Seguridad - Control de acceso', 'Auditoría'].map((tab) => (
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

                {activeTab === 'Agendamiento' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <AppointmentCalendar appointments={appointments} />
                        </div>
                        <div>
                            <PendingExamsWidget exams={pendingExams} />
                        </div>
                    </div>
                )}

                {activeTab === 'Gestión de Pacientes' && (
                    <PatientsManagementTable />
                )}


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
                                    {users?.map(user => (
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

                                            <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditUser(user)}
                                                    className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
                                                >
                                                    Editar
                                                </button>
                                                {user.role !== 'ADMIN' ? (
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className="text-red-500 font-bold hover:text-red-700 transition-colors"
                                                    >
                                                        Eliminar
                                                    </button>
                                                ) : (
                                                    <span className="text-zinc-400 text-xs italic">No se puede eliminar</span>
                                                )}
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
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-zinc-800">Matriz de Permisos</h3>
                                <button
                                    onClick={async () => {
                                        if (confirm('¿Reiniciar matriz de permisos por defecto?')) {
                                            setPermissionFeedback('Inicializando...');
                                            const res = await seedPermissions();
                                            if (res.message === 'Success') {
                                                setPermissionFeedback('✓ Permisos inicializados correctamente');
                                                router.refresh();
                                                setTimeout(() => setPermissionFeedback(null), 3000);
                                            } else {
                                                setPermissionFeedback('✗ Error al inicializar permisos');
                                                setTimeout(() => setPermissionFeedback(null), 3000);
                                            }
                                        }
                                    }}
                                    className="text-xs bg-zinc-800 text-white px-3 py-2 rounded-lg hover:bg-black transition-colors"
                                >
                                    Inicializar Permisos
                                </button>
                            </div>
                            {permissionFeedback && (
                                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${permissionFeedback.includes('✓')
                                    ? 'bg-green-100 text-green-800'
                                    : permissionFeedback.includes('✗')
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {permissionFeedback}
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <PermissionMatrix initialData={initialPermissions} />
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
                            <div className="divide-y divide-zinc-100">
                                {logs?.map((log) => (
                                    <div key={log.id} className="px-6 py-3 flex items-center justify-between hover:bg-zinc-50 text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${log.action.includes('FAILURE') ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                            <span className="font-mono text-zinc-600" suppressHydrationWarning>
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="font-medium text-zinc-900">{log.action}</span>
                                        </div>
                                        <div className="flex gap-4 text-zinc-500 text-xs items-center">
                                            {/* IP Address Display */}
                                            {log.ipAddress && (
                                                <span className="bg-zinc-100 px-2 py-1 rounded text-zinc-500 font-mono">
                                                    {log.ipAddress === '::1' ? 'Localhost' : log.ipAddress}
                                                </span>
                                            )}
                                            <span>User: {log.userEmail || 'System'}</span>
                                            <span className="text-zinc-400 italic truncate max-w-[200px]" title={log.details || ''}>{log.details}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
