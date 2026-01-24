import InternalSidebar from "@/components/InternalSidebar";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import SessionTimeout from "@/components/SessionTimeout";

export const dynamic = 'force-dynamic';

export default async function InternalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    let permissions: string[] = [];

    // Note: Granular permissions using PermisoUsuario to be implemented.
    // Sidebar currently handles ADMIN super-access.

    return (
        <div className="flex h-screen bg-zinc-50">
            <SessionTimeout />
            <InternalSidebar user={session?.user} permissions={permissions} />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
