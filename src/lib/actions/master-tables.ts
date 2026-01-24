'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

// ============================================
// COMUNAS
// ============================================

export async function getComunas() {
    try {
        const comunas = await prisma.comuna.findMany({
            orderBy: { nombre: 'asc' }
        })
        return { success: true, data: comunas }
    } catch (error) {
        console.error('Error fetching comunas:', error)
        return { success: false, error: 'Error al obtener comunas' }
    }
}

export async function createComuna(formData: FormData) {
    try {
        const nombre = formData.get('nombre') as string
        const region = formData.get('region') as string

        await prisma.comuna.create({
            data: { nombre, region }
        })

        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { message: 'Una comuna con ese nombre ya existe' }
        }
        return { message: 'Error al crear comuna' }
    }
}

export async function updateComuna(formData: FormData) {
    try {
        const id = formData.get('id') as string
        const nombre = formData.get('nombre') as string
        const region = formData.get('region') as string
        const activo = formData.get('activo') === 'on'

        await prisma.comuna.update({
            where: { id },
            data: { nombre, region, activo }
        })

        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al actualizar comuna' }
    }
}

export async function deleteComuna(id: string) {
    try {
        await prisma.comuna.delete({ where: { id } })
        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al eliminar comuna' }
    }
}

// ============================================
// PREVISIONES
// ============================================

export async function getPrevisiones() {
    try {
        const previsiones = await prisma.prevision.findMany({
            orderBy: { nombre: 'asc' }
        })
        return { success: true, data: previsiones }
    } catch (error) {
        return { success: false, error: 'Error al obtener previsiones' }
    }
}

export async function createPrevision(formData: FormData) {
    try {
        const nombre = formData.get('nombre') as string
        const tipo = formData.get('tipo') as string

        await prisma.prevision.create({
            data: { nombre, tipo }
        })

        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { message: 'Una previsión con ese nombre ya existe' }
        }
        return { message: 'Error al crear previsión' }
    }
}

export async function updatePrevision(formData: FormData) {
    try {
        const id = formData.get('id') as string
        const nombre = formData.get('nombre') as string
        const tipo = formData.get('tipo') as string
        const activo = formData.get('activo') === 'on'

        await prisma.prevision.update({
            where: { id },
            data: { nombre, tipo, activo }
        })

        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al actualizar previsión' }
    }
}

export async function deletePrevision(id: string) {
    try {
        await prisma.prevision.delete({ where: { id } })
        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al eliminar previsión' }
    }
}

// ============================================
// DIAGNÓSTICOS CIE-10
// ============================================

export async function getDiagnosticos() {
    try {
        const diagnosticos = await prisma.diagnosticoCIE10.findMany({
            orderBy: { codigo: 'asc' }
        })
        return { success: true, data: diagnosticos }
    } catch (error) {
        return { success: false, error: 'Error al obtener diagnósticos' }
    }
}

export async function createDiagnostico(formData: FormData) {
    try {
        const codigo = formData.get('codigo') as string
        const descripcion = formData.get('descripcion') as string
        const categoria = formData.get('categoria') as string || null

        await prisma.diagnosticoCIE10.create({
            data: { codigo, descripcion, categoria }
        })

        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { message: 'Un diagnóstico con ese código ya existe' }
        }
        return { message: 'Error al crear diagnóstico' }
    }
}

export async function updateDiagnostico(formData: FormData) {
    try {
        const id = formData.get('id') as string
        const codigo = formData.get('codigo') as string
        const descripcion = formData.get('descripcion') as string
        const categoria = formData.get('categoria') as string || null
        const activo = formData.get('activo') === 'on'

        await prisma.diagnosticoCIE10.update({
            where: { id },
            data: { codigo, descripcion, categoria, activo }
        })

        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al actualizar diagnóstico' }
    }
}

export async function deleteDiagnostico(id: string) {
    try {
        await prisma.diagnosticoCIE10.delete({ where: { id } })
        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al eliminar diagnóstico' }
    }
}

// ============================================
// MEDICAMENTOS
// ============================================

export async function getMedicamentos() {
    try {
        const medicamentos = await prisma.medicamento.findMany({
            orderBy: { nombre: 'asc' }
        })
        return { success: true, data: medicamentos }
    } catch (error) {
        return { success: false, error: 'Error al obtener medicamentos' }
    }
}

export async function createMedicamento(formData: FormData) {
    try {
        const nombre = formData.get('nombre') as string
        const principioActivo = formData.get('principioActivo') as string || null
        const presentacion = formData.get('presentacion') as string || null
        const laboratorio = formData.get('laboratorio') as string || null

        await prisma.medicamento.create({
            data: { nombre, principioActivo, presentacion, laboratorio }
        })

        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al crear medicamento' }
    }
}

export async function updateMedicamento(formData: FormData) {
    try {
        const id = formData.get('id') as string
        const nombre = formData.get('nombre') as string
        const principioActivo = formData.get('principioActivo') as string || null
        const presentacion = formData.get('presentacion') as string || null
        const laboratorio = formData.get('laboratorio') as string || null
        const activo = formData.get('activo') === 'on'

        await prisma.medicamento.update({
            where: { id },
            data: { nombre, principioActivo, presentacion, laboratorio, activo }
        })

        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al actualizar medicamento' }
    }
}

export async function deleteMedicamento(id: string) {
    try {
        await prisma.medicamento.delete({ where: { id } })
        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al eliminar medicamento' }
    }
}

// ============================================
// INSUMOS
// ============================================

export async function getInsumos() {
    try {
        const insumos = await prisma.insumo.findMany({
            orderBy: { nombre: 'asc' }
        })
        return { success: true, data: insumos }
    } catch (error) {
        return { success: false, error: 'Error al obtener insumos' }
    }
}

export async function createInsumo(formData: FormData) {
    try {
        const nombre = formData.get('nombre') as string
        const categoria = formData.get('categoria') as string || null
        const unidadMedida = formData.get('unidadMedida') as string || null

        await prisma.insumo.create({
            data: { nombre, categoria, unidadMedida }
        })

        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al crear insumo' }
    }
}

export async function updateInsumo(formData: FormData) {
    try {
        const id = formData.get('id') as string
        const nombre = formData.get('nombre') as string
        const categoria = formData.get('categoria') as string || null
        const unidadMedida = formData.get('unidadMedida') as string || null
        const activo = formData.get('activo') === 'on'

        await prisma.insumo.update({
            where: { id },
            data: { nombre, categoria, unidadMedida, activo }
        })

        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al actualizar insumo' }
    }
}

export async function deleteInsumo(id: string) {
    try {
        await prisma.insumo.delete({ where: { id } })
        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al eliminar insumo' }
    }
}

// ============================================
// FERIADOS
// ============================================

export async function getFeriados() {
    try {
        const feriados = await prisma.feriado.findMany({
            orderBy: { fecha: 'asc' }
        })
        return { success: true, data: feriados }
    } catch (error) {
        return { success: false, error: 'Error al obtener feriados' }
    }
}

export async function createFeriado(formData: FormData) {
    try {
        const nombre = formData.get('nombre') as string
        const fecha = new Date(formData.get('fecha') as string)
        const tipo = formData.get('tipo') as string
        const region = formData.get('region') as string || null

        await prisma.feriado.create({
            data: { nombre, fecha, tipo, region }
        })

        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { message: 'Ya existe un feriado para esa fecha y región' }
        }
        return { message: 'Error al crear feriado' }
    }
}

export async function updateFeriado(formData: FormData) {
    try {
        const id = formData.get('id') as string
        const nombre = formData.get('nombre') as string
        const fecha = new Date(formData.get('fecha') as string)
        const tipo = formData.get('tipo') as string
        const region = formData.get('region') as string || null
        const activo = formData.get('activo') === 'on'

        await prisma.feriado.update({
            where: { id },
            data: { nombre, fecha, tipo, region, activo }
        })

        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al actualizar feriado' }
    }
}

export async function deleteFeriado(id: string) {
    try {
        await prisma.feriado.delete({ where: { id } })
        revalidatePath('/admin')
        return { message: 'Success' }
    } catch (error) {
        return { message: 'Error al eliminar feriado' }
    }
}
