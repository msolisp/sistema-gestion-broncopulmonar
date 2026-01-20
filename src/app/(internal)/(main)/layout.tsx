import InternalSidebar from "@/components/InternalSidebar";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function InternalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    let permissions: string[] = [];

    if (session?.user?.role) {
        const rolePermissions = await prisma.rolePermission.findMany({
            where: {
                role: session.user.role,
                enabled: true
            },
            select: { action: true }
        });
        permissions = rolePermissions.map((p: { action: string }) => p.action);
    }

    return (
        <div className="flex h-screen bg-zinc-50">
            {/* <SessionTimeout /> */}
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
