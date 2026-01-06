import Link from "next/link";
import InternalSidebar from "@/components/InternalSidebar";
// import SessionTimeout from "@/components/SessionTimeout";

export default function InternalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Removed await auth() to prevent server-side response errors during layout transitions

    return (
        <div className="flex h-screen bg-zinc-50">
            {/* <SessionTimeout /> */}
            <InternalSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
