
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { Suspense } from "react";

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Suspense fallback={<div>Cargando...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
