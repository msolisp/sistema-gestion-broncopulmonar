'use client'

import MasterTableManager from '../MasterTableManager'
import {
    getComunas, createComuna, updateComuna, deleteComuna,
    getPrevisiones, createPrevision, updatePrevision, deletePrevision,
    getDiagnosticos, createDiagnostico, updateDiagnostico, deleteDiagnostico,
    getMedicamentos, createMedicamento, updateMedicamento, deleteMedicamento,
    getInsumos, createInsumo, updateInsumo, deleteInsumo,
    getFeriados, createFeriado, updateFeriado, deleteFeriado
} from '@/lib/actions/master-tables'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CHILE_REGIONS = [
    "Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo",
    "Valparaíso", "Metropolitana", "O'Higgins", "Maule", "Ñuble",
    "Biobío", "Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"
];

export function ComunasManager() {
    const router = useRouter()
    const [data, setData] = useState<any[]>([])

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        const result = await getComunas()
        if (result.success) setData(result.data)
    }

    return <MasterTableManager
        title="Comunas"
        data={data}
        columns={[
            { key: 'nombre', label: 'Nombre', required: true },
            { key: 'region', label: 'Región', type: 'select', options: CHILE_REGIONS, required: true },
        ]}
        onRefresh={loadData}
        onCreate={createComuna}
        onUpdate={updateComuna}
        onDelete={deleteComuna}
    />
}

export function PrevisionesManager() {
    const [data, setData] = useState<any[]>([])

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        const result = await getPrevisiones()
        if (result.success) setData(result.data)
    }

    return <MasterTableManager
        title="Previsiones"
        data={data}
        columns={[
            { key: 'nombre', label: 'Nombre', required: true },
            { key: 'tipo', label: 'Tipo', type: 'select', options: ['FONASA', 'ISAPRE', 'PARTICULAR'], required: true },
        ]}
        onRefresh={loadData}
        onCreate={createPrevision}
        onUpdate={updatePrevision}
        onDelete={deletePrevision}
    />
}

export function DiagnosticosManager() {
    const [data, setData] = useState<any[]>([])

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        const result = await getDiagnosticos()
        if (result.success) setData(result.data)
    }

    return <MasterTableManager
        title="Diagnósticos CIE-10"
        data={data}
        columns={[
            { key: 'codigo', label: 'Código', required: true },
            { key: 'descripcion', label: 'Descripción', required: true },
            { key: 'categoria', label: 'Categoría' },
        ]}
        onRefresh={loadData}
        onCreate={createDiagnostico}
        onUpdate={updateDiagnostico}
        onDelete={deleteDiagnostico}
    />
}

export function MedicamentosManager() {
    const [data, setData] = useState<any[]>([])

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        const result = await getMedicamentos()
        if (result.success) setData(result.data)
    }

    return <MasterTableManager
        title="Medicamentos"
        data={data}
        columns={[
            { key: 'nombre', label: 'Nombre', required: true },
            { key: 'principioActivo', label: 'Principio Activo' },
            { key: 'presentacion', label: 'Presentación' },
            { key: 'laboratorio', label: 'Laboratorio' },
        ]}
        onRefresh={loadData}
        onCreate={createMedicamento}
        onUpdate={updateMedicamento}
        onDelete={deleteMedicamento}
    />
}

export function InsumosManager() {
    const [data, setData] = useState<any[]>([])

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        const result = await getInsumos()
        if (result.success) setData(result.data)
    }

    return <MasterTableManager
        title="Insumos"
        data={data}
        columns={[
            { key: 'nombre', label: 'Nombre', required: true },
            { key: 'categoria', label: 'Categoría' },
            { key: 'unidadMedida', label: 'Unidad de Medida' },
        ]}
        onRefresh={loadData}
        onCreate={createInsumo}
        onUpdate={updateInsumo}
        onDelete={deleteInsumo}
    />
}

export function FeriadosManager() {
    const [data, setData] = useState<any[]>([])

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        const result = await getFeriados()
        if (result.success) setData(result.data)
    }

    return <MasterTableManager
        title="Feriados"
        data={data}
        columns={[
            { key: 'nombre', label: 'Nombre', required: true },
            { key: 'fecha', label: 'Fecha', type: 'date', required: true },
            { key: 'tipo', label: 'Tipo', type: 'select', options: ['NACIONAL', 'REGIONAL'], required: true },
            { key: 'region', label: 'Región (opcional)', type: 'select', options: CHILE_REGIONS },
        ]}
        onRefresh={loadData}
        onCreate={createFeriado}
        onUpdate={updateFeriado}
        onDelete={deleteFeriado}
    />
}
