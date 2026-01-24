'use server';

import prisma from './prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function addPulmonaryRecord(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) {
        return { message: 'No autenticado' };
    }

    // RBAC: Only ADMIN or KINESIOLOGO can add records
    const userRole = (session.user as any).role;
    console.log("DEBUG: User Role requesting add:", userRole);

    if (userRole !== 'ADMIN' && userRole !== 'KINESIOLOGO') {
        return { message: 'No autorizado: Se requieren privilegios de administrador o kinesiólogo.' };
    }

    const patientId = formData.get('patientId') as string;
    const date = formData.get('date') as string; // YYYY-MM-DD
    const notes = formData.get('notes') as string;

    console.log("--- DEBUG: Adding Pulmonary Record ---");
    console.log("PatientID:", patientId);
    console.log("Date:", date);
    console.log("WalkDistance Raw:", formData.get('walkDistance'));
    console.log("Spo2Rest Raw:", formData.get('spo2Rest'));

    // TM6M
    const walkDistance = formData.get('walkDistance') ? parseFloat(formData.get('walkDistance') as string) : null;
    const spo2Rest = formData.get('spo2Rest') ? parseInt(formData.get('spo2Rest') as string) : null;
    const spo2Final = formData.get('spo2Final') ? parseInt(formData.get('spo2Final') as string) : null;

    // Spirometry
    const cvfValue = formData.get('cvfValue') ? parseFloat(formData.get('cvfValue') as string) : null;
    const cvfPercent = formData.get('cvfPercent') ? parseInt(formData.get('cvfPercent') as string) : null;
    const vef1Value = formData.get('vef1Value') ? parseFloat(formData.get('vef1Value') as string) : null;
    const vef1Percent = formData.get('vef1Percent') ? parseInt(formData.get('vef1Percent') as string) : null;

    // DLCO
    const dlcoPercent = formData.get('dlcoPercent') ? parseInt(formData.get('dlcoPercent') as string) : null;

    try {
        // Resolve FichaClinica ID from Patient ID (Persona ID)
        const ficha = await prisma.fichaClinica.findUnique({
            where: { personaId: patientId }
        });

        if (!ficha) {
            return { message: 'Ficha clínica no encontrada para este paciente' };
        }

        await prisma.pruebaFuncionPulmonar.create({
            data: {
                fichaClinicaId: ficha.id,
                fecha: new Date(date),
                notas: notes,
                walkDistance,
                spo2Rest,
                spo2Final,
                cvfValue,
                cvfPercent,
                vef1Value,
                vef1Percent,
                dlcoPercent
            }
        });

        // Audit Log
        const userStaff = await prisma.usuarioSistema.findFirst({ where: { persona: { email: session.user.email as string } } });
        if (userStaff) {
            await prisma.logAccesoSistema.create({
                data: {
                    accion: 'CREATE_PULMONARY_TEST',
                    accionDetalle: `Patient: ${patientId}, Date: ${date}`,
                    usuarioId: userStaff.id,
                    recurso: 'PRUEBA_FUNCION_PULMONAR',
                    recursoId: 'NEW',
                    ipAddress: '::1'
                }
            });
        }

        revalidatePath(`/patients/${patientId}/history`);
        return { message: 'Registro guardado exitosamente' };
    } catch (error) {
        console.error('Error adding pulmonary record:', error);
        return { message: `Error al guardar el registro: ${(error as Error).message}` };
    }
}

export async function updatePulmonaryRecord(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) {
        return { message: 'No autenticado' };
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'KINESIOLOGO') {
        return { message: 'No autorizado' };
    }

    const recordId = formData.get('recordId') as string;
    const patientId = formData.get('patientId') as string;
    const date = formData.get('date') as string;
    const notes = formData.get('notes') as string;

    // TM6M
    const walkDistance = formData.get('walkDistance') ? parseFloat(formData.get('walkDistance') as string) : null;
    const spo2Rest = formData.get('spo2Rest') ? parseInt(formData.get('spo2Rest') as string) : null;
    const spo2Final = formData.get('spo2Final') ? parseInt(formData.get('spo2Final') as string) : null;

    // Spirometry
    const cvfValue = formData.get('cvfValue') ? parseFloat(formData.get('cvfValue') as string) : null;
    const cvfPercent = formData.get('cvfPercent') ? parseInt(formData.get('cvfPercent') as string) : null;
    const vef1Value = formData.get('vef1Value') ? parseFloat(formData.get('vef1Value') as string) : null;
    const vef1Percent = formData.get('vef1Percent') ? parseInt(formData.get('vef1Percent') as string) : null;

    // DLCO
    const dlcoPercent = formData.get('dlcoPercent') ? parseInt(formData.get('dlcoPercent') as string) : null;

    try {
        // Fetch original record for Audit Diff
        const originalRecord = await prisma.pruebaFuncionPulmonar.findUnique({
            where: { id: recordId },
            select: {
                walkDistance: true,
                spo2Rest: true,
                spo2Final: true,
                cvfValue: true,
                cvfPercent: true,
                vef1Value: true,
                vef1Percent: true,
                dlcoPercent: true,
                notas: true
            }
        });

        await prisma.pruebaFuncionPulmonar.update({
            where: { id: recordId },
            data: {
                fecha: new Date(date),
                notas: notes,
                walkDistance,
                spo2Rest,
                spo2Final,
                cvfValue,
                cvfPercent,
                vef1Value,
                vef1Percent,
                dlcoPercent
            }
        });

        // Calculate Diff
        const changes: string[] = [];
        if (originalRecord) {
            const fmt = (v: any) => v === null ? 'N/A' : v;

            if (originalRecord.walkDistance !== walkDistance) changes.push(`TM6M Distancia: ${fmt(originalRecord.walkDistance)} -> ${fmt(walkDistance)}`);
            if (originalRecord.spo2Rest !== spo2Rest) changes.push(`SpO2 Reposo: ${fmt(originalRecord.spo2Rest)}% -> ${fmt(spo2Rest)}%`);
            if (originalRecord.spo2Final !== spo2Final) changes.push(`SpO2 Final: ${fmt(originalRecord.spo2Final)}% -> ${fmt(spo2Final)}%`);

            if (originalRecord.cvfValue !== cvfValue) changes.push(`CVF: ${fmt(originalRecord.cvfValue)} -> ${fmt(cvfValue)}`);
            if (originalRecord.cvfPercent !== cvfPercent) changes.push(`CVF %: ${fmt(originalRecord.cvfPercent)}% -> ${fmt(cvfPercent)}%`);

            if (originalRecord.vef1Value !== vef1Value) changes.push(`VEF1: ${fmt(originalRecord.vef1Value)} -> ${fmt(vef1Value)}`);
            if (originalRecord.vef1Percent !== vef1Percent) changes.push(`VEF1 %: ${fmt(originalRecord.vef1Percent)}% -> ${fmt(vef1Percent)}%`);

            if (originalRecord.dlcoPercent !== dlcoPercent) changes.push(`DLCO %: ${fmt(originalRecord.dlcoPercent)}% -> ${fmt(dlcoPercent)}%`);

            if (originalRecord.notas !== notes) changes.push(`Notas modificadas`);
        }

        const diffString = changes.length > 0 ? changes.join(', ') : 'Sin cambios detectados';

        const userStaff = await prisma.usuarioSistema.findFirst({ where: { persona: { email: session.user.email as string } } });
        if (userStaff) {
            await prisma.logAccesoSistema.create({
                data: {
                    accion: 'UPDATE_PULMONARY_TEST',
                    accionDetalle: `Record: ${recordId}, Patient: ${patientId}, Changes: [${diffString}]`,
                    usuarioId: userStaff.id,
                    recurso: 'PRUEBA_FUNCION_PULMONAR',
                    recursoId: recordId,
                    ipAddress: '::1'
                }
            });
        }

        revalidatePath(`/patients/${patientId}/history`);
        return { message: 'Registro actualizado exitosamente' };
    } catch (error) {
        console.error('Error updating pulmonary record:', error);
        return { message: `Error al actualizar el registro: ${(error as Error).message}` };
    }
}

export async function getPulmonaryHistory(patientId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const userRole = (session.user as any).role;

    // RBAC: Admin/Kin can see all. Patient can only see their own.
    if (userRole === 'PACIENTE') {
        const persona = await prisma.persona.findUnique({
            where: { email: session.user.email as string }
        });

        // IDOR Check
        if (!persona || persona.id !== patientId) {
            console.warn(`IDOR Attempt blocked: User ${session.user.email} tried to access patient ${patientId}`);
            return [];
        }
    }

    try {
        // Get FichaClinica ID first
        const ficha = await prisma.fichaClinica.findUnique({
            where: { personaId: patientId }
        });

        if (!ficha) return [];

        const history = await prisma.pruebaFuncionPulmonar.findMany({
            where: { fichaClinicaId: ficha.id },
            orderBy: { fecha: 'asc' } // Oldest first for charts
        });

        // Map to legacy interface if needed or return direct if matching
        // The UI expects 'date' but DB has 'fecha'
        return history.map((h: any) => ({
            ...h,
            date: h.fecha, // Map for frontend compatibility
            patientId // Maintain ref
        }));
    } catch (error) {
        console.error('Error fetching pulmonary history:', error);
        return [];
    }
}

export async function deletePulmonaryRecord(recordId: string, patientId: string) {
    const session = await auth();
    if (!session?.user?.email) {
        return { message: 'No autenticado' };
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN' && userRole !== 'KINESIOLOGO') {
        return { message: 'No autorizado' };
    }

    try {
        await prisma.pruebaFuncionPulmonar.delete({
            where: { id: recordId }
        });

        const userStaff = await prisma.usuarioSistema.findFirst({ where: { persona: { email: session.user.email as string } } });
        if (userStaff) {
            await prisma.logAccesoSistema.create({
                data: {
                    accion: 'DELETE_PULMONARY_TEST',
                    accionDetalle: `Record: ${recordId}, Patient: ${patientId}`,
                    usuarioId: userStaff.id,
                    recurso: 'PRUEBA_FUNCION_PULMONAR',
                    recursoId: recordId,
                    ipAddress: '::1'
                }
            });
        }

        revalidatePath(`/patients/${patientId}/history`);
        return { message: 'Registro eliminado exitosamente' };
    } catch (error) {
        console.error('Error deleting pulmonary record:', error);
        return { message: `Error al eliminar el registro: ${(error as Error).message}` };
    }
}
