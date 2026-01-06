import PatientProfileForm from "@/components/PatientProfileForm";
import { getPatientProfile } from "@/actions/patient-profile";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const result = await getPatientProfile();

    if (result.error === "No autorizado") {
        redirect('/login');
    }

    if (!result.user) {
        return (
            <div className="flex justify-center items-center py-20 text-red-500">
                Error: {result.error || "Perfil no encontrado"}
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-zinc-900">Mi Perfil</h1>
                <p className="text-zinc-500">Actualiza tu información personal y de contacto.</p>
            </div>

            <PatientProfileForm user={result.user} />
        </div>
    );
}
