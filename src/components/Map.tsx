import { MapContainer, TileLayer, Circle, Popup, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'
import { CHILE_COMMUNE_COORDS } from '@/lib/chile-coords'

// Fix for default marker icon in Next.js
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Default Chile Center (if no patients)
const CHILE_CENTER: [number, number] = [-35.6751, -71.5430];

interface MapProps {
    patients: Array<{
        id: string;
        commune: string;
        lat?: number;
        lng?: number;
    }>
}

// Component to handle dynamic map bounds
function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [bounds, map]);
    return null;
}

// Helper: Normalize string to match keys (remove accents, uppercase)
const normalizeCommune = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

// Helper to get color from Green (low) to Red (high)
const getColor = (count: number, max: number) => {
    if (max === 0) return 'hsl(120, 100%, 40%)'; // Default Green
    const ratio = count / max;
    const hue = (1 - ratio) * 120;
    return `hsl(${hue}, 80%, 45%)`;
}

export default function Map({ patients }: MapProps) {
    // 1. Aggregate patients by commune and collect available coordinates
    const communeCounts: Record<string, number> = {};
    const locations: L.LatLngExpression[] = [];

    patients.forEach(p => {
        if (!p.commune) return;
        const normalized = normalizeCommune(p.commune);
        const coords = CHILE_COMMUNE_COORDS[normalized];

        if (coords) {
            communeCounts[normalized] = (communeCounts[normalized] || 0) + 1;
            locations.push(coords);
        } else {
            console.warn(`Commune not found in coordinates: ${p.commune} (Normalized: ${normalized})`)
        }
    });

    // 2. Calculate dynamic bounds
    let bounds: L.LatLngBounds | null = null;
    if (locations.length > 0) {
        bounds = L.latLngBounds(locations);
    }

    // 3. Find max count for scaling
    const maxCount = Math.max(...Object.values(communeCounts), 1);

    // Generate a unique key based on the data to force MapContainer to re-mount when data changes.
    const mapKey = JSON.stringify(communeCounts);

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-md border border-zinc-200 z-0 relative">
            <MapContainer
                key={mapKey}
                center={CHILE_CENTER}
                zoom={4}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <ChangeView bounds={bounds} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {Object.entries(communeCounts).map(([commune, count]) => {
                    const coords = CHILE_COMMUNE_COORDS[commune];
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
