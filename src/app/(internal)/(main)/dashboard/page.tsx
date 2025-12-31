
import prisma from "@/lib/prisma";
import DashboardContent from "@/components/DashboardContent";

export default async function DashboardPage() {
    const patients = await prisma.patient.findMany({
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
    });

    return <DashboardContent patients={patients} />;
}
