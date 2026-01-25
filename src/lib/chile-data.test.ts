
import { findRegionByCommune, REGIONS } from './chile-data';

describe('Chile Data', () => {
    describe('REGIONS', () => {
        it('contains 16 regions', () => {
            expect(REGIONS).toHaveLength(16);
        });

        it('every region has communes', () => {
            REGIONS.forEach(region => {
                expect(region.communes.length).toBeGreaterThan(0);
            });
        });
    });

    describe('findRegionByCommune', () => {
        const testCases = [
            { commune: 'Santiago', region: 'Metropolitana de Santiago' },
            { commune: 'Providencia', region: 'Metropolitana de Santiago' },
            { commune: 'Viña del Mar', region: 'Valparaíso' },
            { commune: 'VIÑA DEL MAR', region: 'Valparaíso' }, // Uppercase check
            { commune: 'ñuñoa', region: 'Metropolitana de Santiago' }, // Accent/Special char check
            { commune: 'Nunoa', region: 'Metropolitana de Santiago' }, // Normalize check
        ];

        testCases.forEach(({ commune, region }) => {
            it(`finds ${region} for ${commune}`, () => {
                expect(findRegionByCommune(commune)).toBe(region);
            });
        });

        it('returns undefined for unknown commune', () => {
            expect(findRegionByCommune('New York')).toBeUndefined();
        });

        it('returns undefined for empty input', () => {
            expect(findRegionByCommune('')).toBeUndefined();
        });

        // Edge case: Normalize conflict?
        // e.g. "Los Angeles" vs "Los Ángeles"
        it('handles accents correctly', () => {
            expect(findRegionByCommune('Los Ángeles')).toBe('Biobío');
            expect(findRegionByCommune('Los Angeles')).toBe('Biobío');
        });
    });
});
