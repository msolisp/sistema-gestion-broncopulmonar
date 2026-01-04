
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

    const systemUsers = await prisma.user.findMany({
        where: {
            role: {
                in: ['ADMIN', 'KINESIOLOGIST', 'RECEPTIONIST']
            }
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true
        }
    });

    return <DashboardContent patients={patients} initialUsers={systemUsers} />;

}
