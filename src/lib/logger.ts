import prisma from '@/lib/prisma';

export const logAction = async (
    action: string,
    details: string | null = null,
    userId: string | null = null,
    userEmail: string | null = null
) => {
    try {
        await prisma.systemLog.create({
            data: {
                action,
                details,
                userId,
                userEmail
            }
        });
    } catch (error) {
        console.error('Failed to log action:', error);
        // Do not throw, as logging failure shouldn't stop main flow
    }
};
