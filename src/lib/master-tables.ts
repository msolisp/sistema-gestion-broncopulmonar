import prisma from './prisma';

/**
 * Get all regions with their communes from the database
 */
export async function getRegionsWithCommunes() {
    const comunas = await prisma.comuna.findMany({
        where: { activo: true },
        orderBy: [
            { region: 'asc' },
            { nombre: 'asc' }
        ]
    });

    // Group by region
    const regionMap = new Map<string, string[]>();

    for (const comuna of comunas) {
        if (!regionMap.has(comuna.region)) {
            regionMap.set(comuna.region, []);
        }
        regionMap.get(comuna.region)!.push(comuna.nombre);
    }

    // Convert to array format compatible with existing REGIONS structure
    return Array.from(regionMap.entries()).map(([name, communes]) => ({
        name,
        communes
    }));
}

/**
 * Get all unique regions
 */
export async function getRegions() {
    const result = await prisma.comuna.findMany({
        where: { activo: true },
        select: { region: true },
        distinct: ['region'],
        orderBy: { region: 'asc' }
    });

    return result.map(r => r.region);
}

/**
 * Get communes for a specific region
 */
export async function getComunasByRegion(region: string) {
    const comunas = await prisma.comuna.findMany({
        where: {
            region,
            activo: true
        },
        orderBy: { nombre: 'asc' }
    });

    return comunas.map(c => c.nombre);
}

/**
 * Get all active health insurance providers (previsiones)
 */
export async function getPrevisiones() {
    return await prisma.prevision.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' }
    });
}

/**
 * Get all active CIE-10 diagnoses
 */
export async function getDiagnosticosCIE10() {
    return await prisma.diagnosticoCIE10.findMany({
        where: { activo: true },
        orderBy: [
            { categoria: 'asc' },
            { codigo: 'asc' }
        ]
    });
}

/**
 * Get diagnoses by category
 */
export async function getDiagnosticosByCategoria(categoria: string) {
    return await prisma.diagnosticoCIE10.findMany({
        where: {
            categoria,
            activo: true
        },
        orderBy: { codigo: 'asc' }
    });
}

/**
 * Find region by commune name (helper function)
 */
export async function findRegionByCommune(communeName: string): Promise<string | null> {
    const comuna = await prisma.comuna.findFirst({
        where: {
            nombre: {
                equals: communeName,
                mode: 'insensitive'
            },
            activo: true
        }
    });

    return comuna?.region || null;
}

/**
 * Get holidays for a specific year and region
 */
export async function getFeriados(year: number, region?: string) {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    return await prisma.feriado.findMany({
        where: {
            fecha: {
                gte: startDate,
                lte: endDate
            },
            activo: true,
            OR: [
                { region: null }, // Nacional
                { region: region } // Regional
            ]
        },
        orderBy: { fecha: 'asc' }
    });
}
