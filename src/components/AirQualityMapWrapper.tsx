'use client'

import dynamic from 'next/dynamic'

const AirQualityMap = dynamic(() => import('./AirQualityMap'), {
    ssr: false,
    loading: () => (
        <div className="h-[350px] w-full bg-zinc-100 animate-pulse rounded-xl flex items-center justify-center text-zinc-400">
            Cargando Mapa...
        </div>
    )
})

import { AQIData } from '@/lib/air-quality'

export default function AirQualityMapWrapper({ userCommune, aqiData }: { userCommune: string, aqiData: AQIData[] }) {
    return <AirQualityMap userCommune={userCommune} aqiData={aqiData} />
}
