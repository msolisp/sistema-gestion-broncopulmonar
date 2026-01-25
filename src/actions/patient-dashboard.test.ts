/**
 * @jest-environment node
 */
import { getPatientDashboardData } from './patient-dashboard';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { getRealtimeGlobalAQI } from '@/lib/air-quality';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
    persona: {
        findUnique: jest.fn(),
    },
    cita: {
        findFirst: jest.fn(),
    },
    rol: {
        findFirst: jest.fn(),
    },
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

        (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
            id: 'patient-1',
            comuna: 'SANTIAGO',
            nombre: 'Test',
            apellidoPaterno: 'User',
            fichaClinica: { id: 'fc1' }
        });

        (prisma.cita.findFirst as jest.Mock).mockResolvedValue({
            fecha: new Date(),
            estado: 'PENDING'
        });

        (getRealtimeGlobalAQI as jest.Mock).mockResolvedValue([
            { commune: 'SANTIAGO', aqi: 50, status: 'Bueno' },
            { commune: 'PUENTE ALTO', aqi: 100, status: 'Regular' }
        ]);

        const result = await getPatientDashboardData();

        expect(result).toHaveProperty('patient');
        expect(result).toHaveProperty('nextAppointment');
        expect(result.userName).toBe('Test User');
        expect(result.aqiData).toEqual({ commune: 'SANTIAGO', aqi: 50, status: 'Bueno' });
    });

    it('should return correct AQI for non-Santiago commune', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-2', name: 'Puente Alto User', email: 'user2@test.com' }
        });

        (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
            id: 'patient-2',
            comuna: 'PUENTE ALTO',
            nombre: 'Puente',
            apellidoPaterno: 'Alto',
            fichaClinica: { id: 'fc2' }
        });

        (prisma.cita.findFirst as jest.Mock).mockResolvedValue(null);

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

        (prisma.persona.findUnique as jest.Mock).mockResolvedValue({
            id: 'patient-3',
            comuna: 'UNKNOWN_CITY',
            fichaClinica: { id: 'fc3' }
        });

        (prisma.cita.findFirst as jest.Mock).mockResolvedValue(null);

        (getRealtimeGlobalAQI as jest.Mock).mockResolvedValue([
            { commune: 'SANTIAGO', aqi: 50, status: 'Bueno' } // Only Santiago available/matches default
        ]);

        const result = await getPatientDashboardData();

        expect(result.aqiData).toEqual({ commune: 'SANTIAGO', aqi: 50, status: 'Bueno' });
    });

    it('should return error if patient not found', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-broken', name: 'Broken User', email: 'broken@test.com' }
        });

        // First findUnique returns null
        (prisma.persona.findUnique as jest.Mock).mockResolvedValue(null);

        const result = await getPatientDashboardData();

        // Expect specific error message
        expect(result).toHaveProperty('error');
    });

    it('should handle errors gracefully', async () => {
        (auth as jest.Mock).mockResolvedValue({
            user: { id: 'user-1', name: 'Test User', email: 'test@test.com' }
        });

        (prisma.persona.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const result = await getPatientDashboardData();

        expect(result).toEqual({ error: "Error al cargar datos" });
    });
});
