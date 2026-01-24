import prisma from '@/lib/prisma';

export const logAction = async (
    action: string,
    details: string | null = null,
    userId: string | null = null,
    userEmail: string | null = null,
    ipAddress: string | null = null
) => {
    try {
        // Find system user if email provided
        let usuarioId = userId;
        if (userEmail && !usuarioId) {
            const staff = await prisma.usuarioSistema.findFirst({
                where: { persona: { email: userEmail } },
                select: { id: true }
            });
            if (staff) usuarioId = staff.id;
        }

        // If we still don't have a valid internal ID, we can't log to LogAccesoSistema (strict FK)
        // For now, only log if we have an ID, or maybe find a system-default ID
        if (usuarioId) {
            await prisma.logAccesoSistema.create({
                data: {
                    accion: action,
                    accionDetalle: details,
                    usuarioId: usuarioId as string,
                    recurso: 'SYSTEM',
                    recursoId: 'GENERAL',
                    ipAddress: ipAddress || '::1'
                }
            });
        }
    } catch (error) {
        console.error('Failed to log action:', error);
        // Do not throw, as logging failure shouldn't stop main flow
    }
};
