'use client';

import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { adminCreateSystemUser, adminUpdateSystemUser } from "@/lib/actions.staff";
import { REGIONS } from '@/lib/chile-data';
import { SystemUser, UserRole } from './types';
import { obtenerCuerpoRut, obtenerDigitoVerificador, validarRutChileno } from '@/lib/validators';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userToEdit: SystemUser | null;
    roles: any[];
}

interface UserFormState extends Partial<SystemUser> {
    rutBody?: string;
    rutDv?: string;
}

export function UserModal({ isOpen, onClose, onSuccess, userToEdit, roles }: UserModalProps) {
    const [formData, setFormData] = useState<UserFormState>({});
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial load
    useEffect(() => {
        if (isOpen) {
            if (userToEdit) {
                const fullRut = userToEdit.rut || '';
                setFormData({
                    ...userToEdit,
                    name: userToEdit.name || '',
                    email: userToEdit.email || '',
                    rut: fullRut,
                    rutBody: obtenerCuerpoRut(fullRut),
                    rutDv: obtenerDigitoVerificador(fullRut),
                    region: userToEdit.region || '',
                    commune: userToEdit.commune || '',
                    address: userToEdit.address || '',
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    role: roles.find(r => r.nombre === 'KINESIOLOGO')?.id || roles[0]?.id || '',
                    active: true,
                    rut: '',
                    rutBody: '',
                    rutDv: '',
                    region: '',
                    commune: '',
                    address: ''
                });
            }
            setPassword('');
            setPasswordError(null);
            setSaveFeedback(null);
            setShowPassword(false);
        }
    }, [isOpen, userToEdit]);

    const availableCommunes = formData.region
        ? REGIONS.find(r => r.name === formData.region)?.communes || []
        : [];

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
        if (!/[A-Z]/.test(pwd)) return 'Debe contener al menos una mayúscula';
        if (!/[a-z]/.test(pwd)) return 'Debe contener al menos una minúscula';
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) return 'Debe contener al menos un carácter especial';
        return null;
    };

    const handleSave = async () => {
        // 1. Basic Validation
        const rutBody = (formData as any).rutBody || '';
        const rutDv = (formData as any).rutDv || '';
        const fullRut = rutBody && rutDv ? `${rutBody}-${rutDv}` : '';

        if (!formData.name || !formData.email || !rutBody || !rutDv) {
            setSaveFeedback({ type: 'error', message: 'Nombre, Email y RUT son obligatorios' });
            return;
        }

        // 2. Client-side RUT Validation
        if (!validarRutChileno(fullRut)) {
            setSaveFeedback({ type: 'error', message: 'RUT inválido. Verifique el cuerpo y dígito verificador.' });
            return;
        }

        // 3. Password Validation
        if (!userToEdit) {
            const pwdError = validatePassword(password);
            if (pwdError) {
                setPasswordError(pwdError);
                return;
            }
        } else if (password) {
            const pwdError = validatePassword(password);
            if (pwdError) {
                setPasswordError(pwdError);
                return;
            }
        }

        setIsSubmitting(true);
        setSaveFeedback(null);

        try {
            const data = new FormData();
            data.append('name', formData.name || '');
            data.append('email', formData.email || '');
            data.append('role', formData.role || 'KINESIOLOGO');
            data.append('rutBody', (formData as any).rutBody || '');
            data.append('rutDv', (formData as any).rutDv || '');

            // Handle optional fields
            if (formData.region) data.append('region', formData.region);
            if (formData.commune) data.append('commune', formData.commune);
            if (formData.address) data.append('address', formData.address);

            if (formData.active) data.append('active', 'on');

            // Handle Password
            if (!userToEdit || password) {
                data.append('password', password);
            }

            // Append ID if editing
            if (userToEdit) {
                data.append('id', userToEdit.id);
            }

            const action = userToEdit ? adminUpdateSystemUser : adminCreateSystemUser;
            const res = await action(null, data);

            if (res?.message === 'Success') {
                onSuccess();
                onClose();
            } else {
                setSaveFeedback({ type: 'error', message: res?.message || 'Error al guardar' });
            }
        } catch (error) {
            console.error(error);
            setSaveFeedback({ type: 'error', message: 'Error de conexión' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 flex-shrink-0">
                    <h3 className="font-bold text-zinc-900">{userToEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div>
                        <label htmlFor="userName" className="block text-xs font-medium text-zinc-700 mb-1">Nombre Completo</label>
                        <input
                            id="userName"
                            type="text"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            autoComplete="off"
                        />
                    </div>

                    <div>
                        <label htmlFor="userEmail" className="block text-xs font-medium text-zinc-700 mb-1">Email</label>
                        <input
                            id="userEmail"
                            type="email"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            autoComplete="off"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1">RUT</label>
                        <div className="flex gap-2">
                            <input
                                id="userRutBody"
                                type="text"
                                value={(formData as any).rutBody || ''}
                                onChange={e => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setFormData({ ...formData, rutBody: val });
                                }}
                                maxLength={8}
                                placeholder="12345678"
                                className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                autoComplete="off"
                            />
                            <span className="flex items-center text-zinc-400">-</span>
                            <input
                                id="userRutDv"
                                type="text"
                                value={(formData as any).rutDv || ''}
                                onChange={e => {
                                    const val = e.target.value.toUpperCase().replace(/[^0-9K]/g, '');
                                    setFormData({ ...formData, rutDv: val });
                                }}
                                maxLength={1}
                                placeholder="K"
                                className="w-12 px-3 py-2 border border-zinc-300 rounded-lg text-sm text-center outline-none focus:ring-2 focus:ring-indigo-500"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="userPassword" className="block text-xs font-medium text-zinc-700 mb-1">
                            Contraseña {userToEdit && <span className="text-zinc-400">(dejar vacío para mantener)</span>}
                        </label>
                        <div className="relative">
                            <input
                                id="userPassword"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => {
                                    setPassword(e.target.value);
                                    if (e.target.value) setPasswordError(validatePassword(e.target.value));
                                    else setPasswordError(null);
                                }}
                                placeholder={userToEdit ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
                                className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm outline-none focus:ring-2 ${passwordError ? 'border-red-500 focus:ring-red-500' : 'border-zinc-300 focus:ring-indigo-500'
                                    }`}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}
                    </div>

                    {/* Region/Commune */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="userRegion" className="block text-xs font-medium text-zinc-700 mb-1">Región</label>
                            <select
                                id="userRegion"
                                value={formData.region || ''}
                                onChange={e => setFormData({ ...formData, region: e.target.value, commune: '' })}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Seleccionar</option>
                                {REGIONS.map(r => (
                                    <option key={r.name} value={r.name}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="userCommune" className="block text-xs font-medium text-zinc-700 mb-1">Comuna</label>
                            <select
                                id="userCommune"
                                value={formData.commune || ''}
                                onChange={e => setFormData({ ...formData, commune: e.target.value })}
                                disabled={!formData.region}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-zinc-100"
                            >
                                <option value="">Seleccionar</option>
                                {availableCommunes.map(c => (
                                    <option key={c} value={c.toUpperCase()}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="userAddress" className="block text-xs font-medium text-zinc-700 mb-1">Dirección</label>
                        <input
                            id="userAddress"
                            type="text"
                            value={formData.address || ''}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="userRole" className="block text-xs font-medium text-zinc-700 mb-1">Rol</label>
                        <select
                            id="userRole"
                            value={formData.role || ''}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            disabled={userToEdit?.roleName === 'ADMIN'}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-zinc-100"
                        >
                            {roles
                                .filter(role => role.nombre !== 'ADMIN' || userToEdit?.roleName === 'ADMIN')
                                .map(role => (
                                    <option key={role.id} value={role.id}>
                                        {role.nombre}
                                    </option>
                                ))}
                        </select>
                        {userToEdit?.roleName === 'ADMIN' && <p className="text-xs text-zinc-400 mt-1">El rol de administrador no puede ser modificado</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="activeCheck"
                            checked={!!formData.active}
                            onChange={e => setFormData({ ...formData, active: e.target.checked })}
                            disabled={userToEdit?.roleName === 'ADMIN'}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="activeCheck" className="text-sm text-zinc-700">
                            Usuario Activo
                            {userToEdit?.roleName === 'ADMIN' && <span className="ml-2 text-zinc-400">(No se puede desactivar admin)</span>}
                        </label>
                    </div>
                </div>

                {/* Feedback & Actions */}
                {saveFeedback && (
                    <div className={`mx-6 mb-4 p-3 rounded-lg text-sm font-medium ${saveFeedback.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                        {saveFeedback.message}
                    </div>
                )}

                <div className="px-6 py-4 bg-zinc-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-600 font-medium hover:text-zinc-900">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg font-medium hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                    >
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
