
'use client'

import { MapContainer, TileLayer, Circle, Popup, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Santiago Coordinates
const CENTER: [number, number] = [-33.4489, -70.6693];

interface MapProps {
    patients: Array<{
        id: string;
        commune: string;
        lat?: number;
        lng?: number;
    }>
}

// Comprehensive Santiago Communes Coordinates
const COMMUNE_COORDS: Record<string, [number, number]> = {
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

    // East (Sector Oriente)
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

// Helper: Normalize string to match keys (remove accents, uppercase)
const normalizeCommune = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

// Helper to get color from Green (low) to Red (high)
const getColor = (count: number, max: number) => {
    if (max === 0) return 'hsl(120, 100%, 40%)'; // Default Green
    const ratio = count / max;
    // 120 is Green, 0 is Red.
    // We want low ratio -> Green (120), high ratio -> Red (0)
    const hue = (1 - ratio) * 120;
    return `hsl(${hue}, 80%, 45%)`;
}

export default function Map({ patients }: MapProps) {
    // 1. Aggregate patients by commune
    const communeCounts: Record<string, number> = {};
    patients.forEach(p => {
        if (!p.commune) return;
        const normalized = normalizeCommune(p.commune);

        if (COMMUNE_COORDS[normalized]) {
            communeCounts[normalized] = (communeCounts[normalized] || 0) + 1;
        } else {
            console.warn(`Commune not found in coordinates: ${p.commune} (Normalized: ${normalized})`)
        }
    });

    // 2. Find max count for scaling
    const maxCount = Math.max(...Object.values(communeCounts), 1);

    // Generate a unique key based on the data to force MapContainer to re-mount when data changes.
    // This prevents "Cannot read properties of undefined (reading 'appendChild')" errors in React 18 / Next.js
    // which occur when adding/removing layers dynamically in Strict Mode or rapid updates.
    const mapKey = JSON.stringify(communeCounts);

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-md border border-zinc-200 z-0 relative">
            <MapContainer
                key={mapKey}
                center={CENTER}
                zoom={10}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {Object.entries(communeCounts).map(([commune, count]) => {
                    const coords = COMMUNE_COORDS[commune];
                    const color = getColor(count, maxCount);

                    return (
                        <Circle
                            key={commune}
                            center={coords}
                            pathOptions={{ fillColor: color, color: color, fillOpacity: 0.6 }}
                            radius={1500 + (count * 50)} // Base radius + dynamic growth
                        >
                            <Popup>
                                <div className="text-center">
                                    <strong className="block text-sm font-bold capitalize mb-1">{commune}</strong>
                                    <span className="text-xs text-zinc-600">{count} Pacientes</span>
                                </div>
                            </Popup>
                            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                                <span className='font-bold text-xs'>{count}</span>
                            </Tooltip>
                        </Circle>
                    )
                })}
            </MapContainer>
        </div>
    )
}
