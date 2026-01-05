'use client';

import { useEffect, useState } from "react";
import PatientProfileForm from "@/components/PatientProfileForm";
import { Loader2 } from "lucide-react";
import { getPatientProfile } from "@/actions/patient-profile";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchProfile() {
            try {
                const result = await getPatientProfile();
                if (result.error) {
                    // Redirect to login if unauthorized? Or show error.
                    // If strictly unauthorized, maybe redirect.
                    console.error(result.error);
                } else if (result.user) {
                    setUser(result.user);
                }
            } catch (err) {
                console.error("Failed to load profile");
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!user) {
        return <div>Usuario no encontrado</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-zinc-900">Mi Perfil</h1>
                <p className="text-zinc-500">Actualiza tu información personal y de contacto.</p>
            </div>

            <PatientProfileForm user={user} />
        </div>
    );
}
