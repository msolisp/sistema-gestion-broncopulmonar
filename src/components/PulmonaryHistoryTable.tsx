'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileSpreadsheet, FileText, ChevronLeft, ChevronRight, FileDown, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { EditPulmonaryModal } from './EditPulmonaryModal';
import { deletePulmonaryRecord } from '@/lib/pulmonary';

interface PulmonaryRecord {
    id: string;
    patientId: string;
    date: Date;
    walkDistance: number | null;
    spo2Rest: number | null;
    spo2Final: number | null;
    cvfPercent: number | null;
    vef1Percent: number | null;
    dlcoPercent: number | null;
    notes: string | null;
    cvfValue?: number | null;
    vef1Value?: number | null;
}

export function PulmonaryHistoryTable({ history }: { history: PulmonaryRecord[] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string | null }>({ type: null, message: null });
    const itemsPerPage = 5;

    // Helper to shift Date to UTC midnight for consistent display with date-fns
    const shiftToUTC = (date: Date | string) => {
        const d = new Date(date);
        return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    };

    // Sort by date DESC
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedHistory.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedHistory.length / itemsPerPage);

    const handleExportExcel = () => {
        const dataToExport = sortedHistory.map(r => ({
            'Fecha': format(shiftToUTC(r.date), 'dd/MM/yyyy'),
            'TM6M (m)': r.walkDistance || '-',
            'SpO2 Basal (%)': r.spo2Rest || '-',
            'SpO2 Final (%)': r.spo2Final || '-',
            'CVF %': r.cvfPercent || '-',
            'VEF1 %': r.vef1Percent || '-',
            'CVF (L)': r.cvfValue || '-',
            'VEF1 (L)': r.vef1Value || '-',
            'DLCO %': r.dlcoPercent || '-',
            'Notas': r.notes || ''
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Historial Pulmonar");
        XLSX.writeFile(wb, `historial_pulmonar_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; recordId: string | null; patientId: string | null }>({
        isOpen: false,
        recordId: null,
        patientId: null
    });

    const confirmDelete = (recordId: string, patientId: string) => {
        setDeleteConfirmation({ isOpen: true, recordId, patientId });
    };

    const handleDelete = async () => {
        if (!deleteConfirmation.recordId || !deleteConfirmation.patientId) return;

        setStatus({ type: null, message: null });
        const res = await deletePulmonaryRecord(deleteConfirmation.recordId, deleteConfirmation.patientId);

        if (res.message && !res.message.includes('exitosamente')) {
            setStatus({ type: 'error', message: res.message });
        } else {
            setStatus({ type: 'success', message: 'Registro eliminado correctamente' });
            setTimeout(() => setStatus({ type: null, message: null }), 3000);
        }
        setDeleteConfirmation({ isOpen: false, recordId: null, patientId: null });
    };

    const handleGeneratePDF = (record: PulmonaryRecord) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("Informe de Función Pulmonar", 20, 20);

        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Fecha del Examen: ${format(shiftToUTC(record.date), 'dd MMMM yyyy', { locale: es })}`, 20, 30);

        let yPos = 50;

        // TM6M Section
        doc.setFillColor(240, 253, 244); // emerald-50
        doc.rect(15, yPos - 5, 180, 40, 'F');
        doc.setFontSize(14);
        doc.setTextColor(4, 120, 87); // emerald-700
        doc.text("Test de Marcha (TM6M)", 20, yPos + 5);

        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(`Distancia: ${record.walkDistance ? record.walkDistance + ' m' : '-'}`, 25, yPos + 15);
        doc.text(`SpO2 Basal: ${record.spo2Rest ? record.spo2Rest + '%' : '-'}`, 100, yPos + 15);
        doc.text(`SpO2 Final: ${record.spo2Final ? record.spo2Final + '%' : '-'}`, 100, yPos + 25);

        yPos += 50;

        // Spirometry Section
        doc.setFillColor(239, 246, 255); // blue-50
        doc.rect(15, yPos - 5, 180, 40, 'F');
        doc.setFontSize(14);
        doc.setTextColor(29, 78, 216); // blue-700
        doc.text("Espirometría", 20, yPos + 5);

        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(`CVF: ${record.cvfPercent ? record.cvfPercent + '%' : '-'} ${record.cvfValue ? '(' + record.cvfValue + ' L)' : ''}`, 25, yPos + 15);
        doc.text(`VEF1: ${record.vef1Percent ? record.vef1Percent + '%' : '-'} ${record.vef1Value ? '(' + record.vef1Value + ' L)' : ''}`, 25, yPos + 25);

        yPos += 50;

        // DLCO Section
        doc.setFillColor(255, 247, 237); // orange-50
        doc.rect(15, yPos - 5, 180, 30, 'F');
        doc.setFontSize(14);
        doc.setTextColor(194, 65, 12); // orange-700
        doc.text("Difusión (DLCO)", 20, yPos + 5);

        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(`DLCO: ${record.dlcoPercent ? record.dlcoPercent + '%' : '-'}`, 25, yPos + 15);

        yPos += 40;

        // Notes
        if (record.notes) {
            doc.setFontSize(14);
            doc.setTextColor(40, 40, 40);
            doc.text("Notas Clínicas", 20, yPos);
            doc.setFontSize(11);
            doc.setTextColor(80, 80, 80);

            const splitNotes = doc.splitTextToSize(record.notes, 170);
            doc.text(splitNotes, 20, yPos + 10);
        }

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Sistema de Gestión Broncopulmonar", 20, 280);

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
    };

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-zinc-900">Registros Detallados</h3>
                    <p className="text-sm text-zinc-500">Evolución tabular de los exámenes ingresados.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {status.message && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-right-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                            {status.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {status.message}
                        </div>
                    )}
                    <button
                        onClick={handleExportExcel}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Exportar Excel
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 text-zinc-700 font-medium border-b border-zinc-100">
                        <tr>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3 text-emerald-700">TM6M (m)</th>
                            <th className="px-6 py-3 text-emerald-700">SpO2 (In/Fin)</th>
                            <th className="px-6 py-3 text-blue-700">CVF %</th>
                            <th className="px-6 py-3 text-blue-700">VEF1 %</th>
                            <th className="px-6 py-3 text-orange-700">DLCO %</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {currentItems.map((record) => (
                            <tr key={record.id} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-zinc-900">
                                    {format(shiftToUTC(record.date), 'dd MMM yyyy', { locale: es })}
                                </td>
                                <td className="px-6 py-4 text-emerald-700 font-medium">
                                    {record.walkDistance ? `${record.walkDistance} m` : '-'}
                                </td>
                                <td className="px-6 py-4 text-emerald-700 font-medium">
                                    {record.spo2Rest && record.spo2Final
                                        ? `${record.spo2Rest}% -> ${record.spo2Final}%`
                                        : '-'
                                    }
                                </td>
                                <td className="px-6 py-4 text-blue-700 font-medium">
                                    {record.cvfPercent ? `${record.cvfPercent}%` : '-'}
                                </td>
                                <td className="px-6 py-4 text-blue-700 font-medium">
                                    {record.vef1Percent ? `${record.vef1Percent}%` : '-'}
                                </td>
                                <td className="px-6 py-4 font-bold text-orange-700">
                                    {record.dlcoPercent ? `${record.dlcoPercent}%` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <EditPulmonaryModal patientId={record.patientId} record={record} />
                                        <button
                                            onClick={() => confirmDelete(record.id, record.patientId)}
                                            className="p-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors"
                                            title="Eliminar Registro"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleGeneratePDF(record)}
                                            className="p-1 text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded transition-colors"
                                            title="Generar PDF"
                                        >
                                            <FileText className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {history.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                                    Sin datos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {history.length > itemsPerPage && (
                <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <p className="text-sm text-zinc-500">
                        Mostrando <span className="font-medium text-zinc-900">{indexOfFirstItem + 1}</span> a <span className="font-medium text-zinc-900">{Math.min(indexOfLastItem, history.length)}</span> de <span className="font-medium text-zinc-900">{history.length}</span> registros
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-zinc-200 rounded-lg bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-zinc-200 rounded-lg bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* PDF Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-zoom-in">
                        <div className="p-4 border-b border-zinc-200 flex justify-between items-center bg-zinc-50">
                            <h3 className="text-lg font-bold text-zinc-900">Vista Previa del Informe</h3>
                            <button
                                onClick={() => setPreviewUrl(null)}
                                className="text-zinc-500 hover:text-zinc-700 p-2 hover:bg-zinc-200 rounded-full transition-colors"
                            >
                                <span className="sr-only">Cerrar</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 bg-zinc-100 p-4 overflow-hidden relative">
                            <iframe
                                src={previewUrl}
                                className="w-full h-full rounded-lg shadow-sm bg-white"
                                title="PDF Preview"
                            />
                        </div>
                        <div className="p-4 border-t border-zinc-200 bg-white flex justify-end gap-3">
                            <button
                                onClick={() => setPreviewUrl(null)}
                                className="px-4 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium"
                            >
                                Cerrar
                            </button>
                            <button
                                onClick={() => {
                                    const iframe = document.querySelector('iframe');
                                    if (iframe?.contentWindow) {
                                        iframe.contentWindow.print();
                                    }
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors font-medium flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">Confirmar Eliminación</h3>
                        <p className="text-zinc-600 mb-6">
                            ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmation({ isOpen: false, recordId: null, patientId: null })}
                                className="px-4 py-2 text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors font-medium border border-zinc-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-medium"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
