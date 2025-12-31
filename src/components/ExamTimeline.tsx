'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Building, User, FileText, Download, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

interface Exam {
    id: string;
    centerName: string;
    doctorName: string;
    examDate: Date;
    fileUrl: string;
    fileName: string | null;
}

export default function ExamTimeline({ exams }: { exams: Exam[] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const itemsPerPage = 6;

    if (exams.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-zinc-200">
                <FileText className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-zinc-900">No hay exámenes registrados</h3>
                <p className="text-sm text-zinc-500 mt-1">Sube el primer examen usando el formulario.</p>
            </div>
        );
    }

    // Sort by date DESC
    const sortedExams = [...exams].sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentExams = sortedExams.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedExams.length / itemsPerPage);

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200">
                        <thead className="bg-zinc-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Centro Médico</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Médico</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Fecha</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Archivo</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-zinc-200">
                            {currentExams.map((exam) => (
                                <tr key={exam.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4 text-indigo-500" />
                                            {exam.centerName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-zinc-400" />
                                            {exam.doctorName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-zinc-400" />
                                            {format(new Date(exam.examDate), 'dd/MM/yyyy')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                        <button
                                            onClick={() => setSelectedExam(exam)}
                                            className="flex items-center gap-2 group/file hover:text-indigo-600 transition-colors text-left"
                                            title="Ver documento"
                                        >
                                            <FileText className="h-4 w-4 text-zinc-400 group-hover/file:text-indigo-500" />
                                            <span className="truncate max-w-[150px] underline decoration-dotted decoration-zinc-300 group-hover/file:decoration-indigo-500 cursor-pointer">
                                                {exam.fileName || 'Sin nombre'}
                                            </span>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => setSelectedExam(exam)}
                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-lg transition-colors inline-flex items-center gap-1"
                                        >
                                            <Search className="h-4 w-4" />
                                            <span className="sr-only sm:not-sr-only sm:inline-block">Ver Detalle</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {sortedExams.length > itemsPerPage && (
                <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                    <p className="text-sm text-zinc-500">
                        Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, sortedExams.length)}</span> de <span className="font-medium">{sortedExams.length}</span> exámenes
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-zinc-200 rounded-lg bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-zinc-200 rounded-lg bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedExam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 shrink-0">
                            <h3 className="text-lg font-bold text-zinc-900">Vista del Documento</h3>
                            <button
                                onClick={() => setSelectedExam(null)}
                                className="p-1 rounded-full hover:bg-zinc-200 transition-colors text-zinc-500"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Centro Médico</label>
                                    <p className="text-sm font-medium text-zinc-900">{selectedExam.centerName}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Fecha</label>
                                    <p className="text-sm font-medium text-zinc-900">{format(new Date(selectedExam.examDate), 'dd MMMM, yyyy')}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Médico Tratante</label>
                                    <p className="text-sm font-medium text-zinc-900">{selectedExam.doctorName}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">Archivo</label>
                                    <p className="text-sm font-medium text-zinc-900 break-words">{selectedExam.fileName || 'Sin nombre'}</p>
                                </div>
                            </div>

                            {/* PDF Preview */}
                            <div className="w-full bg-zinc-100 rounded-lg border border-zinc-200 overflow-hidden h-[500px] flex items-center justify-center">
                                {selectedExam.fileUrl && selectedExam.fileUrl !== '#' ? (
                                    <iframe
                                        src={selectedExam.fileUrl}
                                        className="w-full h-full"
                                        title="Vista preliminar del documento"
                                    />
                                ) : (
                                    <div className="text-center p-6 text-zinc-400">
                                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                        <p className="text-sm font-medium text-zinc-900 mb-1">Vista preliminar no disponible</p>
                                        <p className="text-xs text-zinc-500">El archivo es un dato de prueba simulado.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-zinc-100 flex justify-end gap-3 bg-white shrink-0">
                            <button
                                onClick={() => setSelectedExam(null)}
                                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                            >
                                Cerrar
                            </button>
                            <a
                                href={selectedExam.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar Original
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
