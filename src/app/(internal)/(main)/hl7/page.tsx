import { Activity } from 'lucide-react';

export default function HL7Page() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <Activity className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Estándar HL7
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Health Level 7 - El estándar internacional para intercambio de información médica
                    </ p>
                </div>

                {/* Sistema Implementado Badge */}
                <div className="mb-8 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 rounded-lg p-3">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">✅ Este Sistema Implementa HL7</h2>
                            <p className="text-blue-100 mb-3">
                                El <strong>Sistema de Gestión Broncopulmonar</strong> tiene integrado el estándar HL7
                                para permitir la <span className="font-semibold">interoperabilidad con otros sistemas de salud</span>,
                                facilitando el intercambio seguro y estandarizado de información clínica.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 bg-white/10 rounded px-2 py-1">
                                    <span className="text-green-300">✓</span>
                                    <span>Mensajes ADT (Admisión/Alta)</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 rounded px-2 py-1">
                                    <span className="text-green-300">✓</span>
                                    <span>Mensajes ORU (Resultados)</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 rounded px-2 py-1">
                                    <span className="text-green-300">✓</span>
                                    <span>Integración hospitalaria</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 rounded px-2 py-1">
                                    <span className="text-green-300">✓</span>
                                    <span>Interoperabilidad estándar</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Introducción */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        ¿Qué es HL7?
                    </h2>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                        HL7 (Health Level Seven) es un conjunto de estándares internacionales para la transferencia de datos clínicos y administrativos entre aplicaciones de software utilizadas por diversos proveedores de atención médica.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                        El estándar HL7 permite que diferentes sistemas de información hospitalaria (HIS), laboratorios, farmacias y otros sistemas compartan información crítica de pacientes de manera eficiente y segura.
                    </p>
                </div>

                {/* Beneficios */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Beneficios para el Sistema Broncopulmonar
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                        1
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Interoperabilidad
                                    </h3>
                                    <p className="text-gray-600">
                                        Permite integración con sistemas de laboratorio, radiología y otros departamentos del hospital.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                        2
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Reducción de Errores
                                    </h3>
                                    <p className="text-gray-600">
                                        Minimiza errores de transcripción manual al automatizar el intercambio de datos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                        3
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Eficiencia Operativa
                                    </h3>
                                    <p className="text-gray-600">
                                        Acelera procesos administrativos y clínicos mediante comunicación automatizada.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                        4
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Historia Clínica Unificada
                                    </h3>
                                    <p className="text-gray-600">
                                        Consolida información del paciente desde múltiples fuentes en un solo registro.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tipos de Mensajes */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Tipos de Mensajes HL7 Relevantes
                    </h2>

                    <div className="space-y-6">
                        <div className="border-l-4 border-indigo-600 pl-6 py-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                ADT (Admission, Discharge, Transfer)
                            </h3>
                            <p className="text-gray-600 mb-2">
                                Gestión de admisiones, altas y traslados de pacientes.
                            </p>
                            <span className="inline-block bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full">
                                Ejemplo: A01 - Admisión de paciente
                            </span>
                        </div>

                        <div className="border-l-4 border-blue-600 pl-6 py-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                ORM (Order Message)
                            </h3>
                            <p className="text-gray-600 mb-2">
                                Órdenes de exámenes pulmonares y estudios de función respiratoria.
                            </p>
                            <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                                Ejemplo: O01 - Orden de espirometría
                            </span>
                        </div>

                        <div className="border-l-4 border-green-600 pl-6 py-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                ORU (Observation Result)
                            </h3>
                            <p className="text-gray-600 mb-2">
                                Resultados de pruebas de función pulmonar, DLCO, y otros exámenes.
                            </p>
                            <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                                Ejemplo: R01 - Resultados de espirometría
                            </span>
                        </div>

                        <div className="border-l-4 border-purple-600 pl-6 py-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                SIU (Schedule Information Unsolicited)
                            </h3>
                            <p className="text-gray-600 mb-2">
                                Programación de citas y sesiones de rehabilitación pulmonar.
                            </p>
                            <span className="inline-block bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                                Ejemplo: S12 - Notificación de cita agendada
                            </span>
                        </div>
                    </div>
                </div>

                {/* Ejemplo de Mensaje HL7 */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Ejemplo: Mensaje ADT-A01 (Admisión de Paciente)
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Este mensaje se genera cuando un paciente se registra en el sistema broncopulmonar:
                    </p>

                    <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
                        <pre className="text-green-400 text-sm font-mono">
                            {`MSH|^~\\&|BRONCO_SYS|HOSPITAL|HIS|HOSPITAL|20260113023000||ADT^A01|MSG001|P|2.5
EVN|A01|20260113023000
PID|1||10000000-9^^^CHILE||SILVA^MARIA^ARAYA||19770621|F|||CALLE 1 # 421, PUENTE ALTO^^SANTIAGO^13^CHILE||+56912345678|||S||12345678||||METROPOLITANA DE SANTIAGO
PV1|1|O|KINE^SALA_1^01||||123456^GONZALEZ^PEDRO|||KINE||||2|||123456^GONZALEZ^PEDRO||FONASA|||||||||||||||||||||||||20260113
OBX|1|NM|CVF^Capacidad Vital Forzada^LOCAL|1|3.2|L|3.5-4.5|L|||F|||20260113
OBX|2|NM|VEF1^Volumen Espiratorio Forzado^LOCAL|2|2.8|L|2.9-3.8|L|||F|||20260113
OBX|3|NM|SPO2_REPOSO^Saturación O2 Reposo^LOCAL|3|95|%|95-100|N|||F|||20260113`}
                        </pre>
                    </div>

                    <div className="mt-6 grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Segmento MSH (Header)</h4>
                            <p className="text-sm text-gray-600">
                                Contiene información de enrutamiento: sistema origen, destino, tipo de mensaje, ID único.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Segmento PID (Patient ID)</h4>
                            <p className="text-sm text-gray-600">
                                Datos demográficos: RUT, nombre, fecha de nacimiento, dirección, teléfono.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Segmento PV1 (Visit)</h4>
                            <p className="text-sm text-gray-600">
                                Información de la visita: ubicación, médico tratante, tipo de atención.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Segmento OBX (Observations)</h4>
                            <p className="text-sm text-gray-600">
                                Resultados de pruebas: CVF, VEF1, saturación, con valores de referencia.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ejemplo de Resultado Pulmonar */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Ejemplo: Mensaje ORU-R01 (Resultados de Espirometría)
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Mensaje enviado por el equipo de espirometría al sistema:
                    </p>

                    <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
                        <pre className="text-green-400 text-sm font-mono">
                            {`MSH|^~\\&|SPIROMETER|LAB_PULMONAR|BRONCO_SYS|HOSPITAL|20260113104500||ORU^R01|MSG002|P|2.5
PID|1||10000000-9^^^CHILE||SILVA^MARIA^ARAYA
OBR|1||SPIRO20260113001|94010^Espirometría completa^CPT4|||20260113104000|||||||20260113104500|||123456^GONZALEZ^PEDRO^DR||||||20260113104500|||F
OBX|1|NM|CVF^Capacidad Vital Forzada^LOINC|1|3.45|L|3.20-4.80|N|||F|||20260113104500
OBX|2|NM|VEF1^Volumen Espiratorio Forzado en 1 seg^LOINC|2|2.85|L|2.60-3.90|N|||F|||20260113104500
OBX|3|NM|VEF1_CVF^Relación VEF1/CVF^LOINC|3|82.6|%|70-85|N|||F|||20260113104500
OBX|4|NM|PEF^Flujo Espiratorio Pico^LOINC|4|5.2|L/s|4.0-7.0|N|||F|||20260113104500
OBX|5|ST|INTERPRETATION^Interpretación^LOCAL|5|Función pulmonar normal. No se observa patrón obstructivo ni restrictivo.||||||F|||20260113104500`}
                        </pre>
                    </div>

                    <div className="mt-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                            Interpretación del Mensaje
                        </h4>
                        <ul className="space-y-2 text-gray-700">
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">•</span>
                                <span><strong>CVF: 3.45L</strong> - Dentro del rango normal (3.20-4.80L)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">•</span>
                                <span><strong>VEF1: 2.85L</strong> - Normal (2.60-3.90L)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">•</span>
                                <span><strong>VEF1/CVF: 82.6%</strong> - Relación normal, sin obstrucción</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 mr-2">•</span>
                                <span><strong>Conclusión:</strong> Función pulmonar normal</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Casos de Uso */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Casos de Uso en Sistema Broncopulmonar
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-start bg-blue-50 rounded-lg p-5">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                                1
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Registro automático de pacientes
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Al ingresar un paciente al hospital, el HIS envía un mensaje ADT-A01 al sistema broncopulmonar, creando automáticamente su perfil con datos demográficos.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start bg-green-50 rounded-lg p-5">
                            <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                                2
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Importación de resultados de laboratorio
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Los equipos de espirometría y DLCO envían resultados vía ORU-R01, que se integran automáticamente en el historial del paciente.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start bg-purple-50 rounded-lg p-5">
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                                3
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Sincronización de agenda
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Las citas agendadas en el sistema se notifican al HIS central mediante mensajes SIU, manteniendo sincronizadas ambas agendas.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start bg-orange-50 rounded-lg p-5">
                            <div className="flex-shrink-0 w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold mr-4">
                                4
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Alertas clínicas
                                </h3>
                                <p className="text-gray-600 text-sm">
                                    Resultados anormales (ej: CVF \u003c 60% predicho) generan alertas automáticas que se distribuyen a médicos tratantes vía mensajes HL7.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Implementación Futura */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-8 text-white">
                    <h2 className="text-2xl font-bold mb-4">
                        Implementación Futura
                    </h2>
                    <p className="mb-6 text-indigo-100">
                        El sistema está diseñado para incorporar capacidades HL7 en fases futuras:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <h4 className="font-semibold mb-2">Fase 1: Lectura</h4>
                            <p className="text-sm text-indigo-100">
                                Recibir y parsear mensajes HL7 de sistemas externos
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <h4 className="font-semibold mb-2">Fase 2: Escritura</h4>
                            <p className="text-sm text-indigo-100">
                                Generar y enviar mensajes HL7 a otros sistemas
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                            <h4 className="font-semibold mb-2">Fase 3: Bidireccional</h4>
                            <p className="text-sm text-indigo-100">
                                Comunicación completa y sincronización en tiempo real
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-gray-500 text-sm">
                    <p>
                        Para más información sobre HL7, visite{' '}
                        <a
                            href="https://www.hl7.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline"
                        >
                            hl7.org
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
