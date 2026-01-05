/**
 * @jest-environment node
 */
import { getPatientDashboardData } from './patient-dashboard';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { getRealtimeGlobalAQI } from '@/lib/air-quality';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    patient: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
    appointment: {
        findFirst: jest.fn(),
    },
    // We might need to mock transaction if used, but here it's not.
}));

jest.mock('@/auth', () => ({
    auth: jest.fn(),
}));

jest.mock('@/lib/air-quality', () => ({
    getRealtimeGlobalAQI: jest.fn(),
}));

describe('getPatientDashboardData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return unauthorized error if not logged in', async () => {
        (auth as jest.Mock).mockResolvedValue(null);

        const result = await getPatientDashboardData();

        expect(result).toEqual({ error: "No autorizado" });
    });

    it('should return dashboard data for existing patient', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-1', name: 'Test User', email: 'test@test.com' }
        });

        (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
            id: 'patient-1',
            commune: 'SANTIAGO'
        });

        (prisma.appointment.findFirst as jest.Mock).mockResolvedValue({
            date: new Date(),
            status: 'PENDING'
        });

        (getRealtimeGlobalAQI as jest.Mock).mockResolvedValue([
            { commune: 'SANTIAGO', aqi: 50, status: 'Bueno' },
            { commune: 'PUENTE ALTO', aqi: 100, status: 'Regular' }
        ]);

        const result = await getPatientDashboardData();

        expect(result).toHaveProperty('patient');
        expect(result).toHaveProperty('nextAppointment');
        expect(result.userName).toBe('Test User');
        expect(result.aqiData).toEqual({ commune: 'SANTIAGO', aqi: 50, status: 'Bueno' }); // Matches patient commune 'SANTIAGO'
    });

    it('should return correct AQI for non-Santiago commune', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-2', name: 'Puente Alto User', email: 'user2@test.com' }
        });

        (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
            id: 'patient-2',
            commune: 'PUENTE ALTO'
        });

        (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);

        (getRealtimeGlobalAQI as jest.Mock).mockResolvedValue([
            { commune: 'SANTIAGO', aqi: 50, status: 'Bueno' },
            { commune: 'PUENTE ALTO', aqi: 100, status: 'Regular' }
        ]);

        const result = await getPatientDashboardData();

        expect(result.aqiData).toEqual({ commune: 'PUENTE ALTO', aqi: 100, status: 'Regular' });
    });

    it('should fallback to Santiago for unknown commune', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-3', name: 'Unknown User', email: 'user3@test.com' }
        });

        (prisma.patient.findUnique as jest.Mock).mockResolvedValue({
            id: 'patient-3',
            commune: 'UNKNOWN_CITY'
        });

        (prisma.appointment.findFirst as jest.Mock).mockResolvedValue(null);

        (getRealtimeGlobalAQI as jest.Mock).mockResolvedValue([
            { commune: 'SANTIAGO', aqi: 50, status: 'Bueno' } // Only Santiago available/matches default
        ]);

        const result = await getPatientDashboardData();

        expect(result.aqiData).toEqual({ commune: 'SANTIAGO', aqi: 50, status: 'Bueno' });
    });

    it('should return error if patient not found (no auto-recover)', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-broken', name: 'Broken User', email: 'broken@test.com' }
        });

        // First findUnique returns null
        (prisma.patient.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await getPatientDashboardData();

        expect(result).toEqual({ error: "Perfil de paciente no encontrado" });
        expect(prisma.patient.create).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-1', name: 'Test User', email: 'test@test.com' }
        });

        (prisma.patient.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const result = await getPatientDashboardData();

        expect(result).toEqual({ error: "Error al cargar datos" });
    });
});
