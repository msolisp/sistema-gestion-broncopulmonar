'use client'

import { useState, useEffect } from "react"
import { Users, FileText, X, Check, Shield, Eye, EyeOff, FileDown, Disc, Save } from "lucide-react"
import jsPDF from 'jspdf';
import { useRouter, useSearchParams } from "next/navigation";

import { adminCreateSystemUser, adminUpdateSystemUser, toggleRolePermission, seedPermissions, adminDeleteSystemUser, bulkUpdateRolePermissions, updateRolePermissions } from "@/lib/actions";
import PatientsManagementTable from './PatientsManagementTable'
import AppointmentCalendar from './AppointmentCalendar'
import PendingExamsWidget from './PendingExamsWidget'
import { ComunasManager, PrevisionesManager, DiagnosticosManager, MedicamentosManager, InsumosManager, FeriadosManager } from './master-tables';
import { REGIONS } from '@/lib/chile-data';
import { UserModal } from './admin/users/UserModal';
import { SystemUser, UserRole } from './admin/users/types';

// PermissionMatrix Restored - Now with Batch Save
function PermissionMatrix({ initialData }: { initialData: any[] }) {
    const [permissions, setPermissions] = useState(initialData);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    // Sync state when props change, but ONLY if we haven't touched it (to avoid overwriting work in progress?)
    // Actually, usually we want to sync if server revalidated.
    // For simplicity, let's reset dirty state if props change (successful save revalidates)
    useEffect(() => {
        setPermissions(initialData);
        setHasChanges(false);
    }, [initialData]);

    const togglePermission = (index: number, role: 'kine' | 'recep') => {
        const newPermissions = [...permissions];
        const perm = newPermissions[index];
        const newValue = !perm[role];

        // Update local state ONLY
        newPermissions[index] = { ...perm, [role]: newValue };
        setPermissions(newPermissions);
        setHasChanges(true);
    }

    const toggleAll = (role: 'kine' | 'recep', enabled: boolean) => {
        if (!confirm(`¿${enabled ? 'Activar' : 'Desactivar'} todos los permisos localmente para este rol? (Recuerda Guardar)`)) return;

        // Update local state
        const newPermissions = permissions.map(p => ({ ...p, [role]: enabled }));
        setPermissions(newPermissions);
        setHasChanges(true);
    }

    const handleSaveChanges = async () => {
        setIsSaving(true);

        // Calculate changes? Or just send everything?
        // Sending everything is safer and easier.
        // Transform current state to flattened array for server action
        const changes: Array<{ role: string, action: string, enabled: boolean }> = [];

        permissions.forEach(p => {
            changes.push({ role: 'KINESIOLOGIST', action: p.action, enabled: p.kine });
            changes.push({ role: 'RECEPTIONIST', action: p.action, enabled: p.recep });
        });

        const res = await updateRolePermissions(changes);

        if (res?.message === 'Success') {
            // refresh is handled by action revalidate, but we can visually confirm
            // setHasChanges(false) will happen via useEffect when prop comes back
            // But we can optimistically set it to prevent flicker
            setHasChanges(false);
            router.refresh();
        } else {
            alert('Error al guardar cambios');
        }
        setIsSaving(false);
    }

    // Sort/Group helper
    // Only show these modules
    const moduleOrder = [
        'Ver Agendamiento',
        'Ver Pacientes',
        'Ver Reportes BI',
        'Ver Asistente',
        'Ver HL7',
        'Configuración Global',
        'Ver Usuarios'
    ];

    // Filter and Sort permissions
    const sortedPermissions = [...permissions]
        .filter(p => moduleOrder.includes(p.action))
        .sort((a, b) => {
            const idxA = moduleOrder.indexOf(a.action);
            const idxB = moduleOrder.indexOf(b.action);
            return idxA - idxB;
        });

    return (
        <div>
            {hasChanges && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                        <Disc className="w-4 h-4 animate-pulse" />
                        Tienes cambios sin guardar en los permisos.
                    </span>
                    <button
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="bg-indigo-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : (
                            <>
                                <Save className="w-3 h-3" /> Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            )}
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-zinc-100">
                        <th className="text-left py-3 px-4 text-zinc-500">Módulo / Recurso</th>
                        <th className="text-center py-3 px-4 text-blue-700">
                            <div className="flex flex-col items-center gap-1">
                                <span>KINESIÓLOGO</span>
                                <div className="flex gap-1">
                                    <button onClick={() => toggleAll('kine', true)} className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded hover:bg-green-200" title="Activar Todo">✓</button>
                                    <button onClick={() => toggleAll('kine', false)} className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded hover:bg-red-200" title="Desactivar Todo">✕</button>
                                </div>
                            </div>
                        </th>
                        <th className="text-center py-3 px-4 text-orange-700">
                            <div className="flex flex-col items-center gap-1">
                                <span>RECEPCIONISTA</span>
                                <div className="flex gap-1">
                                    <button onClick={() => toggleAll('recep', true)} className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded hover:bg-green-200" title="Activar Todo">✓</button>
                                    <button onClick={() => toggleAll('recep', false)} className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded hover:bg-red-200" title="Desactivar Todo">✕</button>
                                </div>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                    {sortedPermissions.map((p, i) => {
                        // We must find the index in original 'permissions' array to update state correctly
                        const originalIndex = permissions.findIndex(perm => perm.action === p.action);

                        // Simplify coloring: just alternate or clean status
                        return (
                            <tr key={p.action} className="hover:bg-zinc-50 transition-colors">
                                <td className="py-3 px-4 font-medium text-zinc-700">
                                    {p.action}
                                </td>

                                <td className="text-center py-3">
                                    <button
                                        onClick={() => togglePermission(originalIndex, 'kine')}
                                        className={`w-5 h-5 rounded transition-transform active:scale-95 flex items-center justify-center mx-auto ${p.kine ? 'bg-green-500 text-white shadow-sm shadow-green-200' : 'bg-zinc-200 hover:bg-zinc-300'}`}
                                    >
                                        {p.kine && <Check className="w-3 h-3" />}
                                    </button>
                                </td>
                                <td className="text-center py-3">
                                    <button
                                        onClick={() => togglePermission(originalIndex, 'recep')}
                                        className={`w-5 h-5 rounded transition-transform active:scale-95 flex items-center justify-center mx-auto ${p.recep ? 'bg-green-500 text-white shadow-sm shadow-green-200' : 'bg-zinc-200 hover:bg-zinc-300'}`}
                                    >
                                        {p.recep && <Check className="w-3 h-3" />}
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

interface DashboardContentProps {
    initialUsers: any[]
    logs: any[]
    initialPermissions: any[]
    appointments?: any[]
    pendingExams?: any[]
    currentUserRole: UserRole
}
export default function DashboardContent({ initialUsers, logs, initialPermissions, appointments = [], pendingExams = [], currentUserRole }: DashboardContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams()
    const tabFromUrl = searchParams.get('tab')

    // Permission Helper (defined early so we can use it for tab filtering)
    const can = (action: string) => {
        if (currentUserRole === 'ADMIN') return true; // Admins always can
        if (currentUserRole === 'PATIENT') return false;

        // Find permission entry
        const perm = initialPermissions.find(p => p.action === action);
        if (!perm) return false;

        if (currentUserRole === 'KINESIOLOGIST') return perm.kine;
        if (currentUserRole === 'RECEPTIONIST') return perm.recep;

        return false;
    };

    // Define available tabs with their required permissions
    const availableTabs = [
        { name: 'Usuarios y Roles', permission: 'Ver Usuarios' },
        { name: 'Tablas Maestras', permission: 'Configuración Global' },
        { name: 'Seguridad - Control de acceso', permission: 'Configuración Global' },
        { name: 'Auditoría', permission: 'Configuración Global' }
    ];

    // Filter tabs based on permissions
    const visibleTabs = availableTabs.filter(tab => can(tab.permission));

    // Default to first visible tab or fallback
    const defaultTab = visibleTabs.length > 0 ? visibleTabs[0].name : 'Usuarios y Roles';
    const [activeTab, setActiveTab] = useState(tabFromUrl || defaultTab)

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
    const [activeMasterTable, setActiveMasterTable] = useState<string | null>(null);
    const [permissionFeedback, setPermissionFeedback] = useState<string | null>(null);
    const [selectedLog, setSelectedLog] = useState<any | null>(null);

    const handleCreateUser = () => {
        setEditingUser(null)
        setIsUserModalOpen(true)
    }

    const handleEditUser = (user: SystemUser) => {
        setEditingUser(user)
        setIsUserModalOpen(true)
    }

    const handleUserSaved = () => {
        // Refresh happens in modal, but we can double refresh here or just close
        router.refresh();
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

    const handleDownloadLogPDF = () => {
        if (!selectedLog) return;

        const doc = new jsPDF();

        // Header
        doc.setFontSize(16);
        doc.text("Reporte de Auditoría de Sistema", 20, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 20, 28);
        doc.text("Sistema de Gestión Broncopulmonar", 20, 33);

        doc.setDrawColor(200);
        doc.line(20, 38, 190, 38);

        // Content
        doc.setTextColor(0);
        doc.setFontSize(12);

        let y = 50;
        const lineHeight = 10;

        doc.setFont("helvetica", "bold");
        doc.text("Fecha:", 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(new Date(selectedLog.createdAt).toLocaleString(), 60, y);
        y += lineHeight;

        doc.setFont("helvetica", "bold");
        doc.text("Acción:", 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(selectedLog.action, 60, y);
        y += lineHeight;

        doc.setFont("helvetica", "bold");
        doc.text("Usuario:", 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(selectedLog.userEmail || 'System', 60, y);
        y += lineHeight;

        doc.setFont("helvetica", "bold");
        doc.text("Dirección IP:", 20, y);
        doc.setFont("helvetica", "normal");
        doc.text(selectedLog.ipAddress || 'Unknown', 60, y);
        y += lineHeight * 1.5;

        doc.setFont("helvetica", "bold");
        doc.text("Detalles Técnicos:", 20, y);
        y += lineHeight;

        doc.setFont("courier", "normal");
        doc.setFontSize(10);

        // Split text to fit page
        const detailsText = selectedLog.details || 'Sin detalles adicionales.';
        // Simplify details for PDF if it's too complex, or just dump it.
        // If it's the comma separated list, maybe we prefer newlines.
        const formattedDetails = detailsText.replace(/, /g, '\n');

        const splitText = doc.splitTextToSize(formattedDetails, 170);
        doc.text(splitText, 20, y);

        // Footer
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Este documento es confidencial y para uso exclusivo de auditoría interna.", 105, 280, { align: "center" });

        doc.save(`audit-log-${selectedLog.id.substring(0, 8)}.pdf`);
    };

    return (
        <div className="space-y-8 relative">
            {/* User Modal */}
            {/* Log Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                            <h3 className="font-bold text-zinc-800 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                Detalle de Auditoría
                            </h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="text-zinc-400 hover:text-zinc-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Fecha</label>
                                    <p className="text-sm font-medium text-zinc-900 border border-zinc-200 rounded px-3 py-2 bg-zinc-50">
                                        {new Date(selectedLog.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">IP</label>
                                    <p className="text-sm font-mono text-zinc-900 border border-zinc-200 rounded px-3 py-2 bg-zinc-50">
                                        {selectedLog.ipAddress || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Acción</label>
                                <p className="text-sm font-medium text-zinc-900 border border-zinc-200 rounded px-3 py-2 bg-zinc-50 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${selectedLog.action.includes('FAILURE') || selectedLog.action.includes('DELETE') ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                    {selectedLog.action}
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Usuario</label>
                                <p className="text-sm text-zinc-900 border border-zinc-200 rounded px-3 py-2 bg-zinc-50">
                                    {selectedLog.userEmail || 'System'}
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Detalles Técnicos</label>
                                <div className="text-xs font-mono text-zinc-700 border border-zinc-200 rounded px-3 py-2 bg-zinc-50 max-h-48 overflow-y-auto">
                                    {selectedLog.details ? (
                                        <ul className="list-disc pl-4 space-y-1">
                                            {selectedLog.details.split(',').map((detail: string, i: number) => (
                                                <li key={i} className="break-words">
                                                    {detail.trim()}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="italic text-zinc-400">Sin detalles adicionales.</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-3">
                            <button
                                onClick={handleDownloadLogPDF}
                                className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <FileDown className="w-4 h-4" />
                                Descargar PDF
                            </button>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="bg-white border border-zinc-300 text-zinc-700 font-medium px-4 py-2 rounded-lg hover:bg-zinc-50 transition-colors shadow-sm"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            <UserModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSuccess={handleUserSaved}
                userToEdit={editingUser}
            />

            {/* Top Bar with Tabs */}
            <div className="border-b border-zinc-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
                    <h1 className="text-3xl font-bold text-sky-900">Administración Central</h1>

                    <nav className="flex space-x-6 overflow-x-auto">
                        {visibleTabs.map((tab) => (
                            <button
                                key={tab.name}
                                onClick={() => setActiveTab(tab.name)}
                                className={`text-sm font-medium whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === tab.name
                                    ? 'border-sky-600 text-sky-700'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-700'
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content Area based on Active Tab */}
            <div className="animate-in fade-in duration-300">

                {activeTab === 'Agendamiento' && (
                    can('Ver Agendamiento') ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <AppointmentCalendar appointments={appointments} />
                            </div>
                            <div>
                                <PendingExamsWidget exams={pendingExams} />
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-red-300" />
                            <h3 className="text-lg font-bold mb-2">Acceso Denegado</h3>
                            <p className="text-sm">No tienes permisos para ver el módulo de agendamiento.</p>
                        </div>
                    )
                )}




                {activeTab === 'Usuarios y Roles' && (
                    can('Ver Usuarios') ? (
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                                <h3 className="font-bold text-zinc-700">Gestión de Usuarios</h3>
                                {can('Crear Usuarios') && (
                                    <button
                                        onClick={handleCreateUser}
                                        className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                    >
                                        <span>+</span> Nuevo Usuario
                                    </button>
                                )}
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
                                                    {can('Editar Usuarios') && (
                                                        <button
                                                            onClick={() => handleEditUser(user)}
                                                            className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
                                                        >
                                                            Editar
                                                        </button>
                                                    )}
                                                    {user.role !== 'ADMIN' && can('Eliminar Usuarios') ? (
                                                        <button
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="text-red-500 font-bold hover:text-red-700 transition-colors"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    ) : user.role === 'ADMIN' ? (
                                                        <span className="text-zinc-400 text-xs italic">No se puede eliminar</span>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-red-300" />
                            <h3 className="text-lg font-bold mb-2">Acceso Denegado</h3>
                            <p className="text-sm">No tienes permisos para ver el módulo de usuarios.</p>
                        </div>
                    )
                )}

                {activeTab === 'Tablas Maestras' && (
                    can('Configuración Global') ? (
                        <>
                            {!activeMasterTable ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { key: 'comunas', title: 'Comunas', desc: 'Gestionar catálogo de comunas' },
                                        { key: 'previsiones', title: 'Previsiones', desc: 'Gestionar catálogo de previsiones' },
                                        { key: 'diagnosticos', title: 'Diagnósticos CIE-10', desc: 'Gestionar catálogo de diagnósticos cie-10' },
                                        { key: 'medicamentos', title: 'Medicamentos', desc: 'Gestionar catálogo de medicamentos' },
                                        { key: 'insumos', title: 'Insumos', desc: 'Gestionar catálogo de insumos' },
                                        { key: 'feriados', title: 'Feriados', desc: 'Gestionar catálogo de feriados' },
                                    ].map((item) => (
                                        <div
                                            key={item.key}
                                            onClick={() => setActiveMasterTable(item.key)}
                                            className="bg-white p-6 rounded-xl shadow-sm border border-zinc-200 hover:border-indigo-300 transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-zinc-800 group-hover:text-indigo-700">{item.title}</h3>
                                            <p className="text-xs text-zinc-500 mt-2">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    <button
                                        onClick={() => setActiveMasterTable(null)}
                                        className="mb-4 px-4 py-2 text-sm bg-zinc-100 hover:bg-zinc-200 rounded-lg"
                                    >
                                        ← Volver a Tablas Maestras
                                    </button>
                                    {activeMasterTable === 'comunas' && <ComunasManager />}
                                    {activeMasterTable === 'previsiones' && <PrevisionesManager />}
                                    {activeMasterTable === 'diagnosticos' && <DiagnosticosManager />}
                                    {activeMasterTable === 'medicamentos' && <MedicamentosManager />}
                                    {activeMasterTable === 'insumos' && <InsumosManager />}
                                    {activeMasterTable === 'feriados' && <FeriadosManager />}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-red-300" />
                            <h3 className="text-lg font-bold mb-2">Acceso Denegado</h3>
                            <p className="text-sm">No tienes permisos para configurar tablas maestras.</p>
                        </div>
                    )
                )}

                {activeTab === 'Seguridad - Control de acceso' && (
                    can('Configuración Global') ? (
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
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-red-300" />
                            <h3 className="text-lg font-bold mb-2">Acceso Denegado</h3>
                            <p className="text-sm">No tienes permisos para acceder a la configuración de seguridad.</p>
                        </div>
                    )
                )}

                {activeTab === 'Auditoría' && (
                    can('Configuración Global') ? (
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50 flex flex-col md:flex-row justify-between items-center gap-4">
                                <h3 className="font-bold text-zinc-700">Logs de Sistema (Últimas 24h o Filtrados)</h3>
                                <div className="flex gap-2 items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-500">Desde:</span>
                                        <input
                                            type="date"
                                            className="text-sm border border-zinc-200 rounded px-2 py-1"
                                            onChange={(e) => {
                                                const params = new URLSearchParams(searchParams);
                                                if (e.target.value) params.set('auditFrom', e.target.value);
                                                else params.delete('auditFrom');
                                                router.push(`?${params.toString()}`);
                                            }}
                                            defaultValue={searchParams.get('auditFrom') || ''}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-500">Hasta:</span>
                                        <input
                                            type="date"
                                            className="text-sm border border-zinc-200 rounded px-2 py-1"
                                            onChange={(e) => {
                                                const params = new URLSearchParams(searchParams);
                                                if (e.target.value) params.set('auditTo', e.target.value);
                                                else params.delete('auditTo');
                                                router.push(`?${params.toString()}`);
                                            }}
                                            defaultValue={searchParams.get('auditTo') || ''}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-100">
                                        <tr>
                                            <th className="px-6 py-3">Fecha</th>
                                            <th className="px-6 py-3">Acción</th>
                                            <th className="px-6 py-3">Usuario</th>
                                            <th className="px-6 py-3">IP</th>
                                            <th className="px-6 py-3">Detalles</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {logs?.map((log) => {
                                            const actionMap: { [key: string]: string } = {
                                                'CREATE_PULMONARY_TEST': 'Creación Examen Pulmonar',
                                                'UPDATE_PULMONARY_TEST': 'Edición Examen Pulmonar',
                                                'DELETE_PULMONARY_TEST': 'Eliminación Examen Pulmonar',
                                                'LOGIN_SUCCESS': 'Inicio de Sesión Exitoso',
                                                'LOGIN_FAILURE': 'Fallo de Inicio de Sesión',
                                                // Add more mappings as needed
                                            };
                                            const label = actionMap[log.action] || log.action;

                                            return (
                                                <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                                                    <td className="px-6 py-3 whitespace-nowrap text-zinc-500">
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-3 font-medium text-zinc-900">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${log.action.includes('FAILURE') || log.action.includes('DELETE') ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                                                            {label}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-zinc-600">
                                                        {log.userEmail || 'System'}
                                                    </td>
                                                    <td className="px-6 py-3 font-mono text-xs text-zinc-500">
                                                        {log.ipAddress === '::1' ? 'Localhost' : log.ipAddress}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <button
                                                            onClick={() => setSelectedLog(log)}
                                                            className="text-zinc-400 hover:text-indigo-600 transition-colors p-1 rounded-full hover:bg-indigo-50"
                                                            title="Ver Detalle"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {logs?.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                                    No se encontraron registros para el periodo seleccionado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-red-300" />
                            <h3 className="text-lg font-bold mb-2">Acceso Denegado</h3>
                            <p className="text-sm">No tienes permisos para ver los registros de auditoría.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
