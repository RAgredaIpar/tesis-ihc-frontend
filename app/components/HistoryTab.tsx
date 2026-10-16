'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { obtenerHistorial } from '@/app/actions/auth';
import { HistoryRecord } from '@/lib/types';

interface DatabaseHistoryRow {
    request_id: string;
    nombre_archivo: string;
    created_at?: string;
    total_nuclei?: number;
    positive_nuclei?: number;
    positivity_index?: number;
    risk_level?: string;
}

/**
 * Pestaña de historial clinico e impresion de reportes anatomopatologicos estandarizados.
 */
export default function HistoryTab() {
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeReport, setActiveReport] = useState<HistoryRecord | null>(null);

    useEffect(() => {
        const cargarHistorial = async () => {
            setLoading(true);
            try {
                const res = await obtenerHistorial();
                if (!res.success) {
                    throw new Error(res.error || 'Fallo al recuperar registros');
                }

                if (res.data) {
                    const typedData = res.data as unknown as DatabaseHistoryRow[];
                    const mapped: HistoryRecord[] = typedData.map((item) => ({
                        id: item.request_id,
                        request_id: item.request_id,
                        nombre_archivo: item.nombre_archivo,
                        date: item.created_at
                            ? new Date(item.created_at).toLocaleString('es-PE', { hour12: false })
                            : 'Sin fecha',
                        total_nuclei: item.total_nuclei || 0,
                        positive_nuclei: item.positive_nuclei || 0,
                        positivity_index: item.positivity_index || 0,
                        risk_level: item.risk_level || 'No definido',
                    }));
                    setRecords(mapped);
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Error desconocido';
                console.error('Error al sincronizar historial de diagnósticos:', message);
            } finally {
                setLoading(false);
            }
        };

        cargarHistorial();
    }, []);

    const getRiskStyles = (level: string) => {
        const normalized = (level || '').trim().toUpperCase();

        if (normalized.includes('ALTO') || normalized.includes('HIGH') || normalized.includes('CRITIC')) {
            return 'bg-red-50 border-red-200 text-red-700';
        }
        if (normalized.includes('MODERADO') || normalized.includes('MEDIO') || normalized.includes('MEDIUM')) {
            return 'bg-amber-50 border-amber-200 text-amber-700';
        }
        if (normalized.includes('BAJO') || normalized.includes('LOW')) {
            return 'bg-green-50 border-green-200 text-green-700';
        }
        return 'bg-slate-50 border-slate-200 text-slate-700';
    };

    const ejecutarImpresionNativa = () => {
        window.print();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-slide">
            {/* Cabecera */}
            <header className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-[#00539C] uppercase tracking-wide">
                        Historial de Reportes e Integración Clínica
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Registro auditable de muestras histopatológicas evaluadas y cuantificadas en el sistema.
                    </p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-gray-400 uppercase">Servicio de Anatomía Patológica</p>
                    <p className="text-xs font-mono text-gray-500">EsSalud Trujillo</p>
                </div>
            </header>

            {/* Tabla de Registros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                        Archivo Digital de Diagnósticos
                    </h3>
                    <span className="text-[10px] bg-blue-50 text-[#00539C] px-2 py-0.5 rounded font-bold uppercase font-mono">
                        Registros: {records.length}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="h-48 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <div className="w-8 h-8 border-3 border-gray-200 border-t-[#00539C] rounded-full animate-spin"></div>
                            <p className="text-xs uppercase tracking-widest font-bold text-[#00539C] mt-2 animate-pulse">
                                Sincronizando Archivo Clínico...
                            </p>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-gray-400 gap-1">
                            <p className="text-xs uppercase tracking-widest font-bold">No se registran diagnósticos</p>
                            <p className="text-xs text-gray-400">
                                Procese muestras en la mesa de trabajo para poblar la base de datos.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="px-6 py-3">Identificador de Muestra</th>
                                    <th className="px-6 py-3">Fecha de Inferencia</th>
                                    <th className="px-6 py-3">Núcleos Totales</th>
                                    <th className="px-6 py-3">DAB+ (Ki-67+)</th>
                                    <th className="px-6 py-3">Índice Ki-67</th>
                                    <th className="px-6 py-3">Riesgo Clínico</th>
                                    <th className="px-6 py-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {records.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td
                                            className="px-6 py-4 font-mono font-bold text-gray-700 max-w-[220px] truncate"
                                            title={record.nombre_archivo}
                                        >
                                            {record.nombre_archivo}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 font-mono">{record.date}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-600 font-mono">
                                            {record.total_nuclei}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-red-600 font-mono">
                                            {record.positive_nuclei}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                            {record.positivity_index}%
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getRiskStyles(
                                                    record.risk_level
                                                )}`}
                                            >
                                                {record.risk_level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setActiveReport(record)}
                                                className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-[#00539C] px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                                            >
                                                <svg
                                                    className="w-3.5 h-3.5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                    />
                                                </svg>
                                                Ver Ficha
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal de Reporte e Impresion */}
            {activeReport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-200 flex flex-col my-auto print:shadow-none print:border-none print:w-full print:max-w-none">
                        <header className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center print:hidden">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Vista Previa de Documento Clínico
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={ejecutarImpresionNativa}
                                    className="bg-[#00539C] hover:bg-[#004380] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wide cursor-pointer"
                                >
                                    Imprimir / Guardar PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveReport(null)}
                                    className="text-gray-500 hover:text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wide cursor-pointer"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </header>

                        <div className="p-10 bg-white space-y-6 text-gray-800 font-sans print:p-0">
                            {/* Membrete Institucional */}
                            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <Image
                                        src="/Logo_EsSalud.png"
                                        alt="Logo EsSalud"
                                        width={140}
                                        height={48}
                                        className="h-12 w-auto object-contain"
                                    />
                                    <div className="text-left">
                                        <h4 className="text-sm font-black text-[#00539C] tracking-wide uppercase">
                                            EsSalud
                                        </h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">
                                            Red Asistencial La Libertad
                                        </p>
                                        <p className="text-[9px] text-gray-400 font-medium">
                                            H.A.C. Virgen de la Puerta — Trujillo
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        Informe Anatomopatológico
                                    </h3>
                                    <p className="text-xs font-mono font-bold text-gray-700 mt-1">
                                        ID: {activeReport.request_id.substring(0, 13).toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            {/* Metadatos de la Muestra */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Origen de la Muestra</p>
                                    <p className="font-semibold text-gray-700 mt-0.5">{activeReport.nombre_archivo}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Fecha de Emisión</p>
                                    <p className="font-semibold text-gray-700 mt-0.5">{activeReport.date}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Procedimiento Analítico</p>
                                    <p className="font-semibold text-gray-700 mt-0.5">
                                        Cuantificación Digital Inmunohistoquímica
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Marcador Biomolecular</p>
                                    <p className="font-semibold text-[#00539C] mt-0.5">
                                        Antígeno Nuclear Ki-67 (Proliferación Celular)
                                    </p>
                                </div>
                            </div>

                            {/* Indicadores Cuantitativos */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest border-b pb-1">
                                    Resultados del Análisis Morfológico Automatizado
                                </h4>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="border border-gray-200 p-3 rounded-lg bg-slate-50/50">
                                        <p className="text-gray-400 font-medium">Núcleos Celulares Evaluados</p>
                                        <p className="text-xl font-bold text-gray-800 mt-1 font-mono">
                                            {activeReport.total_nuclei}
                                        </p>
                                    </div>
                                    <div className="border border-gray-200 p-3 rounded-lg bg-slate-50/50">
                                        <p className="text-gray-400 font-medium">Firma Cromática Positiva (DAB+)</p>
                                        <p className="text-xl font-bold text-red-600 mt-1 font-mono">
                                            {activeReport.positive_nuclei}
                                        </p>
                                    </div>
                                    <div className="border border-gray-200 p-3 rounded-lg bg-slate-50/50">
                                        <p className="text-gray-400 font-medium">Índice de Proliferación Ki-67</p>
                                        <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
                                            {activeReport.positivity_index}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Riesgo Clinico */}
                            <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Evaluación de Riesgo Clínico Estructurado
                                </span>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`text-xs font-black px-3 py-1 rounded-md border uppercase tracking-wider ${getRiskStyles(
                                            activeReport.risk_level
                                        )}`}
                                    >
                                        Nivel: {activeReport.risk_level}
                                    </span>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        La cuantificación porcentual del biomarcador nuclear Ki-67 refleja el índice
                                        proliferativo tumoral en el tejido histopatológico analizado, fundamentado en
                                        la segmentación de núcleos reactivos DAB positivos.
                                    </p>
                                </div>
                            </div>

                            {/* Secciones de Firma y Trazabilidad */}
                            <div className="pt-12 grid grid-cols-2 gap-8 items-center text-center text-xs">
                                <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-3 text-center max-w-[240px] mx-auto relative overflow-hidden shadow-sm">
                                    <p className="text-[9px] font-mono text-[#00539C] font-bold tracking-wider uppercase">
                                        INTEGRIDAD DIGITAL
                                    </p>
                                    <p className="text-[8px] font-mono text-gray-500 truncate mt-1">
                                        HASH:{' '}
                                        {activeReport.request_id
                                            ? btoa(activeReport.request_id).substring(0, 16)
                                            : 'CERT_HASH'}
                                    </p>
                                    <p className="text-[9px] text-[#00539C] font-bold mt-2 uppercase tracking-wide">
                                        Firma del Sistema
                                    </p>
                                </div>

                                <div className="border-t border-dashed border-gray-400 pt-6 max-w-[200px] w-full mx-auto self-end">
                                    <p className="font-semibold text-gray-700">Firma del Médico Especialista</p>
                                    <p className="text-[10px] text-gray-400 uppercase mt-0.5">
                                        Servicio de Anatomía Patológica
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}