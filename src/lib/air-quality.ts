// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

export type AQILevel = 'Bueno' | 'Regular' | 'Alerta' | 'Preemergencia' | 'Emergencia';

export interface AQIData {
    commune: string;
    originalName?: string;
    value: number; // 0 - 500
    level: AQILevel;
    color: string;
    coords?: [number, number];
}

// ----------------------------------------------------------------------
// DATA & CONSTANTS
// ----------------------------------------------------------------------

export const CENTER_SANTIAGO: [number, number] = [-33.4489, -70.6693];

// Comprehensive List of Santiago Communes Coordinates
export const COMMUNE_COORDS: Record<string, [number, number]> = {
    // North
    'COLINA': [-33.2019, -70.6775],
    'LAMPA': [-33.2847, -70.8711],
    'TIL TIL': [-33.0847, -70.9261],
    'QUILICURA': [-33.3638, -70.7298],
    'HUECHURABA': [-33.3742, -70.6366],
    'RECOLETA': [-33.4068, -70.6277],
    'CONCHALI': [-33.3837, -70.6693],
    'INDEPENDENCIA': [-33.4140, -70.6630],
    // Center
    'SANTIAGO': [-33.4372, -70.6506],
    'PROVIDENCIA': [-33.4312, -70.6120],
    'NUNOA': [-33.4569, -70.6036],
    'SAN MIGUEL': [-33.4939, -70.6506],
    'SAN JOAQUIN': [-33.4939, -70.6210],
    'MACUL': [-33.4920, -70.5985],
    'PEDRO AGUIRRE CERDA': [-33.4869, -70.6865],
    'ESTACION CENTRAL': [-33.4616, -70.6984],
    'CERRILLOS': [-33.5015, -70.7188],
    'LO PRADO': [-33.4444, -70.7298],
    'QUINTA NORMAL': [-33.4410, -70.6865],
    // East
    'LAS CONDES': [-33.4116, -70.5518],
    'VITACURA': [-33.3813, -70.5758],
    'LO BARNECHEA': [-33.3551, -70.5186],
    'LA REINA': [-33.4411, -70.5332],
    'PENALOLEN': [-33.4849, -70.5478],
    'LA FLORIDA': [-33.5227, -70.5985],
    // West
    'MAIPU': [-33.5106, -70.7573],
    'PUDAHUEL': [-33.4417, -70.7675],
    'CERRO NAVIA': [-33.4241, -70.7298],
    'RENCA': [-33.4055, -70.7188],
    'PADRE HURTADO': [-33.5709, -70.8149],
    // South
    'PUENTE ALTO': [-33.6117, -70.5758],
    'SAN BERNARDO': [-33.5922, -70.6984],
    'LA PINTANA': [-33.5855, -70.6277],
    'SAN RAMON': [-33.5358, -70.6366],
    'LA GRANJA': [-33.5284, -70.6210],
    'LO ESPEJO': [-33.5218, -70.6865],
    'LA CISTERNA': [-33.5307, -70.6630],
    'EL BOSQUE': [-33.5599, -70.6775],
    'PIRQUE': [-33.6847, -70.5758],
    'SAN JOSE DE MAIPO': [-33.6427, -70.3559],
    'BUIN': [-33.7314, -70.7419],
    'PAINE': [-33.8052, -70.7419],
}

// ----------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------

// US AQI Breakpoints for PM2.5
// C_low - C_high -> I_low - I_high
const AQI_BREAKPOINTS = [
    { c: [0, 12.0], i: [0, 50] },
    { c: [12.1, 35.4], i: [51, 100] },
    { c: [35.5, 55.4], i: [101, 150] },
    { c: [55.5, 150.4], i: [151, 200] },
    { c: [150.5, 250.4], i: [201, 300] },
    { c: [250.5, 500.4], i: [301, 500] },
];

function calculateUSAQI(concentration: number): number {
    const c = Math.round(concentration * 10) / 10; // Round to 1 decimal
    const bp = AQI_BREAKPOINTS.find(b => c >= b.c[0] && c <= b.c[1]);

    if (!bp) {
        if (c > 500.4) return 500;
        return 0;
    }

    const [cLow, cHigh] = bp.c;
    const [iLow, iHigh] = bp.i;

    return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow);
}

export const getRealtimeGlobalAQI = async (): Promise<AQIData[]> => {
    try {
        const res = await fetch('https://sinca.mma.gob.cl/index.php/json/listadomapa2k19/', {
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!res.ok) throw new Error('Failed to fetch SINCA data');

        const rawData = await res.json();

        return rawData.map((station: any) => {
            // Find ICAP or PM2.5 value
            const realtime = station.realtime || [];
            // Prioritize PM2.5 (MP-2,5)
            const pollutant = realtime.find((r: any) => r.code === 'PM25');
            const pollutantPM10 = realtime.find((r: any) => r.code === 'PM10');

            let rawValue = 0;
            let aqiValue = 0;
            let level: AQILevel = 'Bueno';
            let color = '#22c55e'; // Default Green

            // Extract Raw Value
            if (pollutant && pollutant.info && pollutant.info.rows && pollutant.info.rows.length > 0) {
                // Iterate backwards to find the latest VALID reading
                let validRow = null;
                for (let i = pollutant.info.rows.length - 1; i >= 0; i--) {
                    const row = pollutant.info.rows[i];
                    // Check if tooltip contains valid data (not "no disponible")
                    if (row.c[3]?.v && !row.c[3].v.includes('no disponible')) {
                        validRow = row;
                        break;
                    }
                }

                if (validRow && validRow.c) {
                    // c[1] is usually the ICAP value (Chilean Index), NOT the raw concentration.
                    // The raw concentration is often hidden in the HTML tooltip in c[3].
                    // Format: "<strong>13 &micro;g&#8260;m<sup>3</sup></strong> 26 ICAP..."
                    const tooltip = validRow.c[3]?.v || '';
                    const match = tooltip.match(/<strong>(\d+(?:[.,]\d+)?) &micro;g/);

                    if (match && match[1]) {
                        // Use the extracted concentration (e.g. 13)
                        rawValue = parseFloat(match[1].replace(',', '.'));
                    } else {
                        // Fallback to c[1] if extraction fails, though it might be ICAP
                        rawValue = parseFloat(validRow.c[1]?.v) || 0;
                    }
                }
            } else if (pollutantPM10 && pollutantPM10.info && pollutantPM10.info.rows && pollutantPM10.info.rows.length > 0) {
                // Fallback to PM10 if PM2.5 missing (though conversion is different, we'll simplify or skip)
                // For now, let's just stick to PM2.5 logic roughly, or assume 0 if no PM2.5
                // Better to imply no data if no PM2.5? Let's try to get value.
                const latestRow = pollutantPM10.info.rows[pollutantPM10.info.rows.length - 1];
                if (latestRow && latestRow.c) {
                    // PM10 conversion is roughly 1:1 roughly for low values on some scales but technically diff.
                    // For simplicity in this specific user request context (align with IQAir which loves PM2.5):
                    rawValue = parseFloat(latestRow.c[1]?.v) || 0;
                }
            }

            // Calculate US AQI
            aqiValue = calculateUSAQI(rawValue);

            // Determine Level & Color based on US AQI
            if (aqiValue <= 50) {
                level = 'Bueno';
                color = '#22c55e'; // Green
            } else if (aqiValue <= 100) {
                level = 'Regular';
                color = '#eab308'; // Yellow
            } else if (aqiValue <= 150) {
                level = 'Alerta'; // "Unhealthy for Sensitive Groups"
                color = '#f97316'; // Orange
            } else if (aqiValue <= 200) {
                level = 'Preemergencia'; // "Unhealthy"
                color = '#ef4444'; // Red
            } else if (aqiValue <= 300) {
                level = 'Emergencia'; // "Very Unhealthy"
                color = '#a855f7'; // Purple
            } else {
                level = 'Emergencia'; // "Hazardous"
                color = '#7e22ce'; // Deep Purple/Maroon
            }

            return {
                commune: normalizeCommune(station.comuna || station.nombre),
                originalName: station.nombre,
                value: aqiValue, // Now returning US AQI
                level,
                color,
                coords: [parseFloat(station.latitud), parseFloat(station.longitud)] as [number, number]
            };
        });

    } catch (error) {
        console.error('Error fetching SINCA data:', error);
        return [];
    }
}

export const normalizeCommune = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

