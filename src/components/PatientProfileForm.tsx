
'use client';

import { useActionState, useEffect, useState } from 'react';
import { updatePatientProfile } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Phone, MapPin, Calendar, Heart } from "lucide-react";

import { useRouter } from 'next/navigation';

// Simplified Select if shadcn not fully set up or to reduce complexity
// We'll use native selects for reliability unless we verify shadcn select components exist.
// Given strict component setup, let's look for ui/select. Actually I will use native, safe choice.


import { REGIONS, findRegionByCommune } from '@/lib/chile-data';

export default function PatientProfileForm({ user }: { user: any }) {
    const [state, formAction, isPending] = useActionState(updatePatientProfile, null);
    const router = useRouter();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const patient = user; // The user object passed IS the patient profile data

    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [selectedCommune, setSelectedCommune] = useState<string>('');
    const [gender, setGender] = useState<string>('');
    const [healthSystem, setHealthSystem] = useState<string>('');

    // Derived state - simpler and less error prone
    const availableCommunes = selectedRegion
        ? REGIONS.find(r => r.name === selectedRegion)?.communes || []
        : [];

    // Track if it's the initial load to prevent clearing the existing commune
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        if (state?.message === 'Success') {
            setSuccessMessage("Perfil actualizado correctamente");
            router.refresh(); // Force server component re-fetch
            const timer = setTimeout(() => setSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [state, router]);

    // Initialize Region, Commune, Gender, and Health System
    useEffect(() => {
        // Only run on mount or if patient data fundamentally changes from outside
        if (isInitialLoad) {
            if (patient.commune) {
                const region = findRegionByCommune(patient.commune);
                if (region) {
                    setSelectedRegion(region);
                    setSelectedCommune(patient.commune.toUpperCase());
                }
            }
            if (patient.gender) setGender(patient.gender);
            if (patient.healthSystem) setHealthSystem(patient.healthSystem);
        }
        setIsInitialLoad(false);
    }, [patient.commune, patient.gender, patient.healthSystem, isInitialLoad]);

    // Explicitly handle "User Changed Region" to reset commune
    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newRegion = e.target.value;
        setSelectedRegion(newRegion);
        // User changed region, so we must reset the commune selection
        setSelectedCommune('');
    };

    const handleCommuneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCommune(e.target.value);
    };

    return (
        <Card className="max-w-2xl mx-auto shadow-md border-zinc-200">
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50">
                <CardTitle className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" /> Mis Datos Personales
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <form action={formAction} className="space-y-6">
                    {successMessage && (
                        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                            {successMessage}
                        </div>
                    )}

                    {state?.message && state.message !== 'Success' && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">
                            {state.message}
                        </div>
                    )}

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                            <Input
                                id="name"
                                name="name"
                                defaultValue={user.name || ''}
                                className="pl-9 bg-white border-zinc-200 text-zinc-900 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-zinc-300"
                                required
                                minLength={2}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={patient.phone || ''}
                                    className="pl-9 bg-white border-zinc-200 text-zinc-900 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-zinc-300"
                                    placeholder="+56 9 ..."
                                />
                            </div>
                        </div>

                        {/* Birth Date */}
                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                <Input
                                    id="birthDate"
                                    name="birthDate"
                                    type="date"
                                    defaultValue={patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : ''}
                                    className="pl-9 bg-white border-zinc-200 text-zinc-900 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-zinc-300"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address & Commune */}
                    <div className="space-y-4 md:space-y-0">
                        <div className="space-y-2 mb-6">
                            <Label htmlFor="address">Dirección</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                <Input
                                    id="address"
                                    name="address"
                                    defaultValue={patient.address || ''}
                                    className="pl-9 bg-white border-zinc-200 text-zinc-900 focus:ring-indigo-500 focus:border-indigo-500 transition-all hover:border-zinc-300"
                                    placeholder="Calle, número..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Region Selector */}
                            <div className="space-y-2">
                                <Label htmlFor="region">Región</Label>
                                <select
                                    id="region"
                                    value={selectedRegion}
                                    onChange={handleRegionChange}
                                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-zinc-300 text-zinc-900"
                                >
                                    <option value="">Seleccionar Región</option>
                                    {REGIONS.map((region) => (
                                        <option key={region.name} value={region.name}>
                                            {region.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Commune Selector */}
                            <div className="space-y-2">
                                <Label htmlFor="commune">Comuna</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <select
                                        id="commune"
                                        name="commune"
                                        value={selectedCommune}
                                        onChange={handleCommuneChange}
                                        className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 transition-all hover:border-zinc-300 text-zinc-900"
                                    >
                                        <option value="">Seleccionar Comuna</option>
                                        {availableCommunes.map((commune) => (
                                            <option key={commune} value={commune.toUpperCase()}>
                                                {commune}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Gender */}
                        <div className="space-y-2">
                            <Label htmlFor="gender">Género</Label>
                            <div className="relative">
                                <select
                                    id="gender"
                                    name="gender"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-zinc-300 text-zinc-900"
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>

                        {/* Health System */}
                        <div className="space-y-2">
                            <Label htmlFor="healthSystem">Previsión</Label>
                            <div className="relative">
                                <Heart className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                <select
                                    id="healthSystem"
                                    name="healthSystem"
                                    value={healthSystem}
                                    onChange={(e) => setHealthSystem(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 transition-all hover:border-zinc-300 text-zinc-900"
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="FONASA">FONASA</option>
                                    <option value="ISAPRE">ISAPRE</option>
                                    <option value="PARTICULAR">PARTICULAR</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 min-w-[150px]" disabled={isPending}>
                            {isPending ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </form >
            </CardContent >
        </Card >
    );
}
