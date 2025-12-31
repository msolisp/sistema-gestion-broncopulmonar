'use client'

import { MapContainer, TileLayer, Circle, Popup, Tooltip, useMap, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'
import { CENTER_SANTIAGO, COMMUNE_COORDS, normalizeCommune, AQIData } from '@/lib/air-quality'

// ... (rest of imports/setup remains same)

// ----------------------------------------------------------------------
// TYPES & HELPERS
// ----------------------------------------------------------------------

interface AirQualityMapProps {
    userCommune?: string;
    aqiData: AQIData[];
}

// Component to recenter map
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, 12);
    }, [center, map]);
    return null;
}

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export default function AirQualityMap({ userCommune, aqiData }: AirQualityMapProps) {
    let focusCenter = CENTER_SANTIAGO;
    if (userCommune) {
        const normalized = normalizeCommune(userCommune);
        // Try to find station coords first
        const station = aqiData.find(d => d.commune === normalized);
        if (station && station.coords) {
            focusCenter = station.coords;
        } else if (COMMUNE_COORDS[normalized]) {
            // Fallback to static coords if station not found but commune exists in our list
            focusCenter = COMMUNE_COORDS[normalized];
        }
    }

    return (
        <div className="h-[350px] w-full rounded-xl overflow-hidden shadow-sm border border-zinc-200 z-0 relative">
            <MapContainer center={focusCenter} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 0 }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/carto">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapUpdater center={focusCenter} />

                {aqiData.map((data) => {
                    const coords = data.coords;
                    if (!coords) return null;

                    const isUserCommune = userCommune && normalizeCommune(userCommune) === data.commune;

                    return (
                        <div key={data.originalName || data.commune}>
                            <Circle
                                center={coords}
                                pathOptions={{
                                    fillColor: data.color,
                                    color: isUserCommune ? '#000' : 'transparent',
                                    weight: 2,
                                    fillOpacity: 0.6
                                }}
                                radius={1200}
                            >
                                <Popup>
                                    <div className="text-center min-w-[120px]">
                                        <strong className="block text-sm font-bold capitalize mb-1">{data.originalName || data.commune}</strong>
                                        <div className="text-xs mb-1">ICA: <strong>{data.value}</strong></div>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: data.color }}>
                                            {data.level}
                                        </span>
                                    </div>
                                </Popup>
                                {isUserCommune && (
                                    <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                                        <span className='font-bold text-xs'>Tu Comuna</span>
                                    </Tooltip>
                                )}
                            </Circle>
                            {/* Score Label */}
                            <Marker
                                position={coords}
                                icon={L.divIcon({
                                    className: 'bg-transparent',
                                    html: `<div class="flex items-center justify-center -ml-3 -mt-3"><span class="text-[10px] font-bold text-zinc-800 bg-white/70 px-1.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">${data.value}</span></div>`
                                })}
                                interactive={false}
                            />
                        </div>
                    )
                })}
            </MapContainer>

            {/* Legend Overlay */}
            <div className="absolute bottom-2 right-2 bg-white/95 p-3 rounded-lg text-xs shadow-lg border border-zinc-200 z-[1000]">
                <div className="font-bold mb-2 text-zinc-900">Índice Calidad Aire</div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 border border-green-600"></span> <span className="text-zinc-700">Bueno (0-50)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600"></span> <span className="text-zinc-700">Regular (51-100)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 border border-orange-600"></span> <span className="text-zinc-700">Alerta (101-200)</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 border border-red-600"></span> <span className="text-zinc-700">Preemergencia (200+)</span></div>
                </div>
            </div>
        </div>
    )
}
