// import { auth, signOut } from "@/auth";
import PatientNavbar from "@/components/PatientNavbar";
import SessionTimeout from "@/components/SessionTimeout";

export default function PatientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // CRITICAL FIX: Removed server-side auth() call.
    // Auth protection is handled by Middleware.
    // User state is handled by Client Components (SessionProvider).

    return (
        <div className="min-h-screen bg-zinc-50">
            <SessionTimeout />
            <PatientNavbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}
