
import {
    getRegionsWithCommunes, getRegions, getComunasByRegion,
    getPrevisiones, getDiagnosticosCIE10, getDiagnosticosByCategoria,
    findRegionByCommune, getFeriados
} from './master-tables';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
    comuna: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
    },
    prevision: {
        findMany: jest.fn(),
    },
    diagnosticoCIE10: {
        findMany: jest.fn(),
    },
    feriado: {
        findMany: jest.fn(),
    }
}));

describe('Master Tables Lib Utils', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getRegionsWithCommunes', () => {
        it('groups communes by region', async () => {
            (prisma.comuna.findMany as jest.Mock).mockResolvedValue([
                { id: '1', nombre: 'Santiago', region: 'RM' },
                { id: '2', nombre: 'Providencia', region: 'RM' },
                { id: '3', nombre: 'Valparaíso', region: 'Valparaíso' }
            ]);

            const result = await getRegionsWithCommunes();

            expect(result).toHaveLength(2);
            const rm = result.find(r => r.name === 'RM');
            expect(rm?.communes).toHaveLength(2);
            expect(rm?.communes).toContain('Santiago');
            expect(rm?.communes).toContain('Providencia');
        });
    });

    describe('getRegions', () => {
        it('returns distinct regions', async () => {
            (prisma.comuna.findMany as jest.Mock).mockResolvedValue([
                { region: 'RM' }, { region: 'Valparaíso' }
            ]);
            const result = await getRegions();
            expect(result).toEqual(['RM', 'Valparaíso']);
        });
    });

    describe('getComunasByRegion', () => {
        it('returns communes for region', async () => {
            (prisma.comuna.findMany as jest.Mock).mockResolvedValue([
                { nombre: 'Santiago' }
            ]);
            const result = await getComunasByRegion('RM');
            expect(result).toEqual(['Santiago']);
        });
    });

    describe('findRegionByCommune', () => {
        it('returns region if found', async () => {
            (prisma.comuna.findFirst as jest.Mock).mockResolvedValue({ region: 'RM' });
            const result = await findRegionByCommune('Santiago');
            expect(result).toBe('RM');
        });

        it('returns null if not found', async () => {
            (prisma.comuna.findFirst as jest.Mock).mockResolvedValue(null);
            const result = await findRegionByCommune('Unknown');
            expect(result).toBeNull();
        });
    });

    describe('getFeriados', () => {
        it('filters by year and region', async () => {
            (prisma.feriado.findMany as jest.Mock).mockResolvedValue([]);
            await getFeriados(2024, 'RM');
            expect(prisma.feriado.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    fecha: expect.anything()
                })
            }));
        });
    });

    // Simple pass-through coverage
    it('getPrevisiones calls prisma', async () => {
        await getPrevisiones();
        expect(prisma.prevision.findMany).toHaveBeenCalled();
    });

    it('getDiagnosticosCIE10 calls prisma', async () => {
        await getDiagnosticosCIE10();
        expect(prisma.diagnosticoCIE10.findMany).toHaveBeenCalled();
    });
});
