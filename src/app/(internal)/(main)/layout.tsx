import Link from "next/link";
import InternalSidebar from "@/components/InternalSidebar";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function InternalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    return (
        <div className="flex h-screen bg-zinc-50">
            {/* <SessionTimeout /> */}
            <InternalSidebar user={session?.user} />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
