'use client'

import { useState, useEffect } from "react"
import { Users, FileText, X, Check, Shield, Eye, EyeOff, FileDown, Disc, Save } from "lucide-react"
import jsPDF from 'jspdf';
import { useRouter, useSearchParams } from "next/navigation";

import {
    adminCreateSystemUser,
    adminUpdateSystemUser,
    adminDeleteSystemUser,
    seedPermissions
} from "@/lib/actions.staff";
import {
    createRole,
    deleteRole,
    updateRole,
    updateRolePermissionsBatch
} from "@/lib/actions/dynamic-rbac";

import PatientsManagementTable from './PatientsManagementTable'
import AppointmentCalendar from './AppointmentCalendar'
import PendingExamsWidget from './PendingExamsWidget'
import { ComunasManager, PrevisionesManager, DiagnosticosManager, MedicamentosManager, InsumosManager, FeriadosManager } from './master-tables';
import { REGIONS } from '@/lib/chile-data';
import { UserModal } from './admin/users/UserModal';
import { SystemUser, UserRole } from './admin/users/types';

// Generic Modern Confirmation Modal
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", isDestructive = false }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 mb-2">{title}</h3>
                    <p className="text-sm text-zinc-500">{message}</p>
                </div>
                <div className="px-6 py-4 bg-zinc-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 font-medium hover:text-zinc-900">
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-4 py-2 text-sm text-white rounded-lg font-medium shadow-sm transition-colors ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

function LogDetailsModal({ isOpen, onClose, log }: { isOpen: boolean, onClose: () => void, log: any }) {
    if (!isOpen || !log) return null;

    let detailsStr = log.details;
    let detailsObj = null;

    try {
        // Try to parse if it looks like JSON/Object, otherwise keep as string
        if (typeof detailsStr === 'string' && (detailsStr.startsWith('{') || detailsStr.startsWith('['))) {
            detailsObj = JSON.parse(detailsStr);
        }
    } catch (e) {
        // failed to parse, use string
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900">Detalle de Auditoría</h3>
                        <p className="text-xs text-zinc-500 font-mono mt-1">{log.id}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Fecha</label>
                            <p className="text-sm font-medium text-zinc-900">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Usuario</label>
                            <p className="text-sm font-medium text-zinc-900">{log.userEmail}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-500 uppercase">Acción</label>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                                {log.action}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-500 uppercase block">Detalles del Evento</label>
                        <div className="bg-zinc-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                                {detailsObj ? JSON.stringify(detailsObj, null, 2) : log.details}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-zinc-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm bg-white border border-zinc-300 rounded-lg font-medium hover:bg-zinc-50"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

// PermissionMatrix - Fully Dynamic
function PermissionMatrix({ initialData, roles }: { initialData: any[], roles: any[] }) {
    const [permissions, setPermissions] = useState(initialData);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info' | null; message: string | null }>({
        type: null,
        message: null
    });
    const router = useRouter();

    useEffect(() => {
        if (!hasChanges) {
            setPermissions(initialData);
        }
    }, [initialData, hasChanges]);

    useEffect(() => {
        if (status.type === 'success' || status.type === 'info') {
            const timer = setTimeout(() => {
                setStatus({ type: null, message: null });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const togglePermission = (index: number, roleName: string) => {
        const newPermissions = [...permissions];
        const perm = newPermissions[index];
        const key = roleName.toLowerCase();
        const newValue = !perm[key];

        newPermissions[index] = { ...perm, [key]: newValue };
        setPermissions(newPermissions);
        setHasChanges(true);
    };

    const handleSavePermissions = async () => {
        setIsSaving(true);
        setStatus({ type: 'info', message: 'Guardando cambios...' });

        try {
            const changes: any[] = [];
            permissions.forEach(p => {
                roles.forEach(role => {
                    const key = role.nombre.toLowerCase();
                    changes.push({
                        roleId: role.id,
                        recurso: p.recurso || p.action.replace('Ver ', ''),
                        accion: 'Ver',
                        activo: !!p[key]
                    });
                });
            });

            const res = await updateRolePermissionsBatch(changes);
            if (res.message === 'Success') {
                setStatus({ type: 'success', message: '✓ Permisos actualizados correctamente' });
                setHasChanges(false);
                router.refresh();
            } else {
                setStatus({ type: 'error', message: res.message });
            }
        } catch (e) {
            setStatus({ type: 'error', message: 'Error de conexión' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {status.message && (
                <div className={`p-3 rounded-lg text-sm font-medium ${status.type === 'success' ? 'bg-green-100 text-green-800' :
                    status.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                    {status.message}
                </div>
            )}
            <table className="w-full text-xs">
                <thead className="text-zinc-500 uppercase bg-zinc-50 border-b border-zinc-100">
                    <tr>
                        <th className="px-4 py-3 text-left">Módulo</th>
                        {roles.map(role => (
                            <th key={role.id} className="px-4 py-3 text-center">
                                <span className={role.nombre === 'ADMIN' ? 'text-purple-600' : 'text-indigo-600'}>
                                    {role.nombre}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {permissions.map((m, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50">
                            <td className="px-4 py-3 font-medium text-zinc-700">{m.action}</td>
                            {roles.map(role => {
                                const key = role.nombre.toLowerCase();
                                return (
                                    <td key={role.id} className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => togglePermission(idx, role.nombre)}
                                            disabled={role.nombre === 'ADMIN'}
                                            className={`p-1.5 rounded transition-colors ${m[key] ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-400'}`}
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            {hasChanges && (
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSavePermissions}
                        disabled={isSaving}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Matriz'}
                    </button>
                </div>
            )}
        </div>
    );
}

// Role Management Component
function PatientPortalPermissions({ permissions, roleId }: { permissions: any[], roleId?: string }) {
    const [perms, setPerms] = useState(permissions);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setPerms(permissions);
    }, [permissions]);

    const togglePermission = (index: number) => {
        const newPerms = [...perms];
        newPerms[index].enabled = !newPerms[index].enabled;
        setPerms(newPerms);
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!roleId) return;
        setIsSaving(true);

        const mappedChanges = perms.map((p: any) => ({
            roleId,
            recurso: p.recurso,
            accion: p.dbAction || p.action,
            activo: p.enabled
        }));

        await updateRolePermissionsBatch(mappedChanges);
        setIsSaving(false);
        setHasChanges(false);
        router.refresh();
    };

    if (!roleId) return <div className="text-sm text-red-500">Rol PACIENTE no encontrado. Créalo en la sección de roles.</div>;

    return (
        <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-zinc-700">Permisos del Paciente</h4>
                {hasChanges && (
                    <button onClick={handleSave} disabled={isSaving} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {perms.map((p: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border">
                        <span className="text-sm font-medium text-zinc-600">{p.action || p.label}</span>
                        <button
                            onClick={() => togglePermission(idx)}
                            className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${p.enabled ? 'bg-emerald-500 justify-end' : 'bg-zinc-300 justify-start'}`}
                        >
                            <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Role Management Component - Grid Refactor
function RoleManagement({ initialRoles }: { initialRoles: any[] }) {
    const [roles, setRoles] = useState(initialRoles);
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRoleId, setCurrentRoleId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ nombre: '', descripcion: '' });

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

    const router = useRouter();

    useEffect(() => {
        setRoles(initialRoles);
    }, [initialRoles]);

    const handleCreateRole = async () => {
        if (!formData.nombre) return;
        const res = await createRole(formData);
        if (res.message === 'Success') {
            setIsAdding(false);
            setFormData({ nombre: '', descripcion: '' });
            router.refresh();
        } else {
            alert(res.message);
        }
    };

    const handleUpdateRole = async () => {
        if (!currentRoleId || !formData.nombre) return;
        // Optimization: We could add an updateRole action if not exists, but for now we assume create/delete. 
        // Wait, the user asked for EDIT. I need to use updateRole action I saw in dynamic-rbac.ts
        const res = await updateRole(currentRoleId, { ...formData, active: true });
        if (res.message === 'Success') {
            setIsEditing(false);
            setFormData({ nombre: '', descripcion: '' });
            setCurrentRoleId(null);
            router.refresh();
        } else {
            alert(res.message);
        }
    };

    const onDeleteClick = (id: string) => {
        setRoleToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteRole = async () => {
        if (!roleToDelete) return;
        const res = await deleteRole(roleToDelete);
        if (res.message === 'Success') {
            router.refresh();
        } else {
            alert(res.message); // Should ideally be a toast, but keeping consistent for errors for now
        }
        setIsDeleteModalOpen(false);
        setRoleToDelete(null);
    };

    const startEdit = (role: any) => {
        setFormData({ nombre: role.nombre, descripcion: role.descripcion || '' });
        setCurrentRoleId(role.id);
        setIsEditing(true);
        setIsAdding(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-zinc-800">Mantenedor de Roles</h3>
                {!isAdding && !isEditing && (
                    <button
                        onClick={() => { setIsAdding(true); setFormData({ nombre: '', descripcion: '' }); }}
                        className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700"
                    >
                        + Nuevo Rol
                    </button>
                )}
            </div>

            {(isAdding || isEditing) && (
                <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <h4 className="font-bold text-zinc-700">{isAdding ? 'Crear Nuevo Rol' : 'Editar Rol'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500">Nombre del Rol (Identificador)</label>
                            <input
                                placeholder="EJ: SUPERVISOR"
                                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none uppercase"
                                value={formData.nombre}
                                onChange={e => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                                disabled={isEditing && (formData.nombre === 'ADMIN' || formData.nombre === 'PACIENTE')}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-zinc-500">Descripción</label>
                            <input
                                placeholder="Descripción breve del rol..."
                                className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                value={formData.descripcion}
                                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => { setIsAdding(false); setIsEditing(false); }}
                            className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={isAdding ? handleCreateRole : handleUpdateRole}
                            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm"
                        >
                            {isAdding ? 'Crear Rol' : 'Guardar Cambios'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Nombre Rol</th>
                            <th className="px-6 py-4">Descripción</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {roles.map((role: any) => (
                            <tr key={role.id} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-zinc-800">
                                    {role.nombre}
                                </td>
                                <td className="px-6 py-4 text-zinc-600">
                                    {role.descripcion || <span className="text-zinc-400 italic">Sin descripción</span>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Activo
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                        onClick={() => startEdit(role)}
                                        className="text-indigo-600 hover:text-indigo-900 font-medium text-xs px-2 py-1 rounded hover:bg-indigo-50"
                                    >
                                        Editar
                                    </button>
                                    {role.nombre !== 'ADMIN' && role.nombre !== 'PACIENTE' && (
                                        <button
                                            onClick={() => onDeleteClick(role.id)}
                                            className="text-red-500 hover:text-red-700 font-medium text-xs px-2 py-1 rounded hover:bg-red-50"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {roles.length === 0 && (
                    <div className="p-8 text-center text-zinc-500">
                        No hay roles definidos.
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteRole}
                title="Eliminar Rol"
                message="¿Estás seguro de que deseas eliminar este rol? Esta acción no se puede deshacer y podría afectar a usuarios asignados."
                confirmText="Eliminar"
                isDestructive={true}
            />
        </div>
    );
}

interface DashboardContentProps {
    initialUsers: any[]
    logs: any[]
    initialPermissions: any[]
    appointments: any[]
    pendingExams: any[]
    currentUserRole: string
    initialRoles: any[]
    patientRole?: any
    patientPermissions?: any[]
}

export default function DashboardContent({
    initialUsers,
    logs,
    initialPermissions,
    appointments,
    pendingExams,
    currentUserRole,
    initialRoles,
    patientRole,
    patientPermissions
}: DashboardContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams()
    const tabFromUrl = searchParams.get('tab')

    const can = (action: string) => {
        if (currentUserRole === 'ADMIN') return true;
        const perm = initialPermissions.find(p => p.action === action);
        if (!perm) return false;
        const key = currentUserRole.toLowerCase();
        return !!perm[key];
    };

    const patientModules = [
        { action: 'Mis Citas', recurso: 'Portal_Pacientes', dbAction: 'Ver Citas' },
        { action: 'Historial Médico', recurso: 'Portal_Pacientes', dbAction: 'Ver Historial' },
        { action: 'Mis Datos', recurso: 'Portal_Pacientes', dbAction: 'Ver Perfil' }
    ];

    const availableTabs = [
        { name: 'Usuarios y Roles', permission: 'Ver Usuarios' },
        { name: 'Tablas Maestras', permission: 'Configuración Global' },
        { name: 'Seguridad - Control de acceso', permission: 'Configuración Global' },
        { name: 'Auditoría', permission: 'Configuración Global' }
    ];

    const visibleTabs = availableTabs.filter(tab => can(tab.permission));
    const defaultTab = visibleTabs.length > 0 ? visibleTabs[0].name : 'Usuarios y Roles';
    const [activeTab, setActiveTab] = useState(tabFromUrl || defaultTab)

    useEffect(() => {
        if (tabFromUrl) setActiveTab(tabFromUrl)
    }, [tabFromUrl])

    const [users, setUsers] = useState<SystemUser[]>(initialUsers as SystemUser[]);
    useEffect(() => {
        setUsers(initialUsers as SystemUser[]);
    }, [initialUsers]);

    const [isUserModalOpen, setIsUserModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
    const [activeMasterTable, setActiveMasterTable] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);

    const handleCreateUser = () => {
        setEditingUser(null)
        setIsUserModalOpen(true)
    }

    const handleEditUser = (user: SystemUser) => {
        setEditingUser(user)
        setIsUserModalOpen(true)
    }

    const handleDeleteUser = async (user: SystemUser) => {
        if (!confirm(`¿Estás seguro?`)) return;
        const res = await adminDeleteSystemUser(user.id);
        if (res?.message === 'Success') router.refresh();
        else alert(res?.message);
    }

    return (
        <div className="space-y-8">
            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSuccess={() => router.refresh()}
                userToEdit={editingUser}
                roles={initialRoles}
            />

            <div className="border-b border-zinc-200">
                <div className="flex justify-between items-center pb-4">
                    <h1 className="text-2xl font-bold text-sky-900">Administración Central</h1>
                    <nav className="flex space-x-6">
                        {visibleTabs.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeTab === tab.name ? 'border-sky-600 text-sky-700' : 'border-transparent text-zinc-500'
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="animate-in fade-in duration-300">
                {activeTab === 'Usuarios y Roles' && (
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                            <h3 className="font-bold text-zinc-700">Gestión de Usuarios</h3>
                            <button onClick={handleCreateUser} className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg font-medium">+ Nuevo Usuario</button>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50">
                                <tr>
                                    <th className="px-6 py-3">Usuario</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Rol</th>
                                    <th className="px-6 py-3">Estado</th>
                                    <th className="px-6 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-zinc-50">
                                        <td className="px-6 py-4 font-medium">{user.name}</td>
                                        <td className="px-6 py-4 text-zinc-500">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                                {user.roleName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.active ? <span className="text-green-600">Activo</span> : <span className="text-zinc-400">Inactivo</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleEditUser(user)} className="text-indigo-600 mr-3">Editar</button>
                                            {user.role !== 'ADMIN' && <button onClick={() => handleDeleteUser(user)} className="text-red-500">Eliminar</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'Seguridad - Control de acceso' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-zinc-800 mb-4">Portal Interno (Staff)</h3>
                            <PermissionMatrix initialData={initialPermissions} roles={initialRoles} />
                        </div>

                        <div className="border-t pt-8">
                            <h3 className="text-lg font-bold text-zinc-800 mb-4">Portal Pacientes</h3>
                            <PatientPortalPermissions permissions={patientPermissions || []} roleId={patientRole?.id} />
                        </div>
                        <div className="border-t pt-8">
                            <RoleManagement initialRoles={initialRoles} />
                        </div>
                    </div>
                )}

                {activeTab === 'Tablas Maestras' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200">
                        {!activeMasterTable ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { key: 'comunas', title: 'Comunas' },
                                    { key: 'previsiones', title: 'Previsiones' },
                                    { key: 'diagnosticos', title: 'Diagnósticos' },
                                    { key: 'medicamentos', title: 'Medicamentos' },
                                    { key: 'insumos', title: 'Insumos' },
                                    { key: 'feriados', title: 'Feriados' },
                                ].map((item) => (
                                    <div key={item.key} onClick={() => setActiveMasterTable(item.key)} className="p-6 border rounded-xl hover:border-indigo-500 cursor-pointer">
                                        <h4 className="font-bold">{item.title}</h4>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <button onClick={() => setActiveMasterTable(null)} className="mb-4 text-sm text-indigo-600">← Volver</button>
                                {activeMasterTable === 'comunas' && <ComunasManager />}
                                {activeMasterTable === 'previsiones' && <PrevisionesManager />}
                                {activeMasterTable === 'diagnosticos' && <DiagnosticosManager />}
                                {activeMasterTable === 'medicamentos' && <MedicamentosManager />}
                                {activeMasterTable === 'insumos' && <InsumosManager />}
                                {activeMasterTable === 'feriados' && <FeriadosManager />}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Auditoría' && (
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                                <tr>
                                    <th className="px-6 py-3">Fecha</th>
                                    <th className="px-6 py-3">Acción</th>
                                    <th className="px-6 py-3">Usuario</th>
                                    <th className="px-6 py-3">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {logs.map((log: any) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-indigo-50 transition-colors cursor-pointer group"
                                        onClick={() => setSelectedLog(log)}
                                    >
                                        <td className="px-6 py-3 text-zinc-600 group-hover:text-indigo-700 font-medium">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3 font-bold text-zinc-800">
                                            {log.action}
                                        </td>
                                        <td className="px-6 py-3 text-zinc-600">{log.userEmail}</td>
                                        <td className="px-6 py-3 text-xs font-mono text-zinc-500 truncate max-w-xs">
                                            {log.details.substring(0, 50)}
                                            {log.details.length > 50 && '...'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={false} onClose={() => { }} onConfirm={() => { }}
                title="Confirmar" message="¿Estás seguro?"
            />

            <LogDetailsModal
                isOpen={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                log={selectedLog}
            />
        </div>
    )
}
