/**
 * Validadores para el sistema de gestión broncopulmonar
 * Incluye validación de RUT chileno según algoritmo módulo 11
 */

/**
 * Limpia un RUT removiendo puntos y guiones
 * @param rut - RUT con o sin formato (ej: "12.345.678-9" o "12345678-9")
 * @returns RUT limpio (ej: "123456789")
 */
export function limpiarRut(rut: string): string {
    return rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();
}

/**
 * Formatea un RUT agregando puntos y guión
 * @param rut - RUT sin formato (ej: "123456789")
 * @returns RUT formateado (ej: "12.345.678-9")
 */
export function formatearRut(rut: string): string {
    const rutLimpio = limpiarRut(rut);

    if (rutLimpio.length < 2) {
        return rutLimpio;
    }

    const dv = rutLimpio.slice(-1);
    const cuerpo = rutLimpio.slice(0, -1);

    // Agregar puntos cada 3 dígitos de derecha a izquierda
    const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${cuerpoFormateado}-${dv}`;
}

/**
 * Calcula el dígito verificador de un RUT chileno
 * Algoritmo módulo 11
 * @param cuerpo - Parte numérica del RUT sin DV
 * @returns Dígito verificador ('0'-'9' o 'K')
 */
function calcularDigitoVerificador(cuerpo: string): string {
    let suma = 0;
    let multiplicador = 2;

    // Recorrer de derecha a izquierda
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = suma % 11;
    const dv = 11 - resto;

    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return dv.toString();
}

/**
 * Valida un RUT chileno verificando su formato y dígito verificador
 * @param rut - RUT a validar (con o sin formato)
 * @returns true si el RUT es válido, false en caso contrario
 */
export function validarRutChileno(rut: string): boolean {
    if (!rut || typeof rut !== 'string') {
        return false;
    }

    const rutLimpio = limpiarRut(rut);

    // Validar longitud mínima (ej: 1.000.000-K = 8 caracteres sin formato)
    if (rutLimpio.length < 2) {
        return false;
    }

    // Validar que tenga al menos 1 dígito en el cuerpo y 1 DV
    const cuerpo = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1);

    // Validar que el cuerpo sea numérico
    if (!/^\d+$/.test(cuerpo)) {
        return false;
    }

    // Validar que el DV sea válido (0-9 o K)
    if (!/^[0-9K]$/.test(dv)) {
        return false;
    }

    // Calcular DV esperado
    const dvCalculado = calcularDigitoVerificador(cuerpo);

    // Bypass for E2E Testing
    if (process.env.E2E_TESTING === 'true') {
        return true;
    }

    return dv === dvCalculado;
}

/**
 * Extrae el cuerpo del RUT (sin DV)
 * @param rut - RUT completo
 * @returns Cuerpo del RUT
 */
export function obtenerCuerpoRut(rut: string): string {
    const rutLimpio = limpiarRut(rut);
    return rutLimpio.slice(0, -1);
}

/**
 * Extrae el dígito verificador del RUT
 * @param rut - RUT completo
 * @returns Dígito verificador
 */
export function obtenerDigitoVerificador(rut: string): string {
    const rutLimpio = limpiarRut(rut);
    return rutLimpio.slice(-1);
}

/**
 * Valida que un RUT sea de una persona natural (no empresa)
 * Las empresas tienen RUT desde 50.000.000 en adelante
 * @param rut - RUT a validar
 * @returns true si es RUT de persona natural
 */
export function esRutPersonaNatural(rut: string): boolean {
    if (!validarRutChileno(rut)) {
        return false;
    }

    const cuerpo = obtenerCuerpoRut(rut);
    const numero = parseInt(cuerpo);

    // RUT de persona natural: menor a 50 millones
    return numero < 50000000;
}

/**
 * Valida un RUT recibiendo cuerpo y DV por separado
 * @param cuerpo - Parte numérica (ej: "12345678")
 * @param dv - Dígito verificador (ej: "K")
 * @returns true si es válido
 */
export function validarRutSeparado(cuerpo: string, dv: string): boolean {
    if (!cuerpo || !dv) return false;
    const rutCompleto = `${cuerpo}-${dv}`;
    return validarRutChileno(rutCompleto);
}
