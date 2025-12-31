'use client'

import { useActionState, useMemo, useState, useEffect } from 'react'
import { updatePatientProfile } from '@/lib/actions'
import { User, Phone, MapPin, Building, Save, Calendar, HeartPulse } from 'lucide-react'

const initialState = {
    message: '',
}

interface PatientProfileFormProps {
    user: {
        name: string | null;
        patientProfile: {
            phone: string | null;
            address: string | null;
            commune: string;
            gender: string | null;
            birthDate: Date | null;
            healthSystem: string | null;
        } | null
    }
}

function calculateAge(birthDate: Date | string | null) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

export default function PatientProfileForm({ user }: PatientProfileFormProps) {
    const [state, dispatch] = useActionState(updatePatientProfile, initialState)
    const [birthDate, setBirthDate] = useState(user.patientProfile?.birthDate ? new Date(user.patientProfile.birthDate).toISOString().split('T')[0] : '')

    const age = useMemo(() => calculateAge(birthDate), [birthDate]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-600" />
                Mis Datos
            </h2>

            {state.message && (
                <div className={`mb-6 p-4 rounded-lg text-sm flex items-center ${state.message === 'Success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {state.message === 'Success' ? 'Datos actualizados correctamente' : `Error: ${state.message}`}
                </div>
            )}

            <form action={dispatch} className="space-y-5">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">Nombre Completo</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-zinc-400" />
                        </div>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            defaultValue={user.name || ''}
                            className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors text-zinc-900"
                            placeholder="Tu nombre"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="birthDate" className="block text-sm font-medium text-zinc-700 mb-1">Fecha de Nacimiento</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-5 w-5 text-zinc-400" />
                            </div>
                            <input
                                type="date"
                                name="birthDate"
                                id="birthDate"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors text-zinc-900"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Edad</label>
                        <div className="px-3 py-2 border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-900 sm:text-sm">
                            {age !== null ? `${age} años` : '-'}
                        </div>
                    </div>
                </div>

                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-zinc-700 mb-1">Género</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-zinc-400" />
                        </div>
                        <select
                            name="gender"
                            id="gender"
                            defaultValue={user.patientProfile?.gender || ''}
                            className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors appearance-none bg-white text-zinc-900"
                        >
                            <option value="">Selecciona tu género</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="healthSystem" className="block text-sm font-medium text-zinc-700 mb-1">Previsión</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <HeartPulse className="h-5 w-5 text-zinc-400" />
                        </div>
                        <select
                            name="healthSystem"
                            id="healthSystem"
                            defaultValue={user.patientProfile?.healthSystem || ''}
                            className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors appearance-none bg-white text-zinc-900"
                        >
                            <option value="">Selecciona tu previsión</option>
                            <option value="FONASA">FONASA</option>
                            <option value="ISAPRE">ISAPRE</option>
                            <option value="PARTICULAR">PARTICULAR</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 mb-1">Teléfono</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-zinc-400" />
                        </div>
                        <input
                            type="tel"
                            name="phone"
                            id="phone"
                            defaultValue={user.patientProfile?.phone || ''}
                            className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors text-zinc-900"
                            placeholder="+56 9 1234 5678"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-zinc-700 mb-1">Dirección</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MapPin className="h-5 w-5 text-zinc-400" />
                        </div>
                        <input
                            type="text"
                            name="address"
                            id="address"
                            defaultValue={user.patientProfile?.address || ''}
                            className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors text-zinc-900"
                            placeholder="Calle 123, Depto 4"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="commune" className="block text-sm font-medium text-zinc-700 mb-1">Comuna</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building className="h-5 w-5 text-zinc-400" />
                        </div>
                        <select
                            name="commune"
                            id="commune"
                            defaultValue={user.patientProfile?.commune || ''}
                            className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors appearance-none bg-white text-zinc-900"
                        >
                            <option value="">Selecciona tu comuna</option>
                            <option value="SANTIAGO">Santiago</option>
                            <option value="PROVIDENCIA">Providencia</option>
                            <option value="LAS CONDES">Las Condes</option>
                            <option value="MAIPU">Maipú</option>
                            <option value="LA FLORIDA">La Florida</option>
                            <option value="PUENTE ALTO">Puente Alto</option>
                            {/* Add more communes as needed */}
                        </select>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    )
}
