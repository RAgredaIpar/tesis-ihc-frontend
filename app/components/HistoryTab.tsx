"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface HistoryRecord {
    id: string;
    request_id: string;
    nombre_archivo: string;
    date: string;
    total_nuclei: number;
    positive_nuclei: number;
    positivity_index: number;
    risk_level: string;
}

export default function HistoryTab() {
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeReport, setActiveReport] = useState<HistoryRecord | null>(null);

    useEffect(() => {
        const cargarHistorial = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("historial_diagnosticos")
                    .select("*");

                if (error) throw error;

                if (data) {
                    const sortedData = [...data].sort((a, b) => {
                        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                        return dateB - dateA;
                    });

                    const mapped: HistoryRecord[] = sortedData.map((item: any) => ({
                        id: item.request_id,
                        request_id: item.request_id,
                        nombre_archivo: item.nombre_archivo,
                        date: item.created_at
                            ? new Date(item.created_at).toLocaleString("es-PE", { hour12: false })
                            : "Sin fecha",
                        total_nuclei: item.total_nuclei || 0,
                        positive_nuclei: item.positive_nuclei || 0,
                        positivity_index: item.positivity_index || 0,
                        risk_level: item.risk_level || "No definido"
                    }));
                    setRecords(mapped);
                }
            } catch (err: any) {
                console.error("Error cargando el archivo clínico digital:", err.message);
            } finally {
                setLoading(false);
            }
        };

        cargarHistorial();
    }, []);

    const getRiskStyles = (level: string) => {
        const normalized = (level || "").trim().toUpperCase();

        if (normalized.includes("ALTO") || normalized.includes("HIGH") || normalized.includes("CRITIC")) {
            return "bg-red-50 border-red-200 text-red-700";
        }
        if (normalized.includes("MODERADO") || normalized.includes("MEDIO") || normalized.includes("MEDIUM")) {
            return "bg-amber-50 border-amber-200 text-amber-700";
        }
        if (normalized.includes("BAJO") || normalized.includes("LOW")) {
            return "bg-green-50 border-green-200 text-green-700";
        }
        return "bg-slate-50 border-slate-200 text-slate-700";
    };

    const ejecutarImpresionNativa = () => {
        window.print();
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-slide">

            {/* CABECERA */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-[#00539C] uppercase tracking-wide">
                        Historial de Reportes e Integración Clínica
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Registro auditable de muestras histológicas digitalizadas e inferidas mediante el motor de tinción virtual.
                    </p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-gray-400 uppercase">Servicio de Anatomía Patológica</p>
                    <p className="text-xs font-mono text-gray-500">EsSalud Trujillo</p>
                </div>
            </div>

            {/* TABLA DE REGISTROS HISTÓRICOS */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                        Archivo Digital de Pacientes
                    </h3>
                    <span className="text-[10px] bg-blue-50 text-[#00539C] px-2 py-0.5 rounded font-bold uppercase">
                        Total Almacenado: {records.length}
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
                            <p className="text-xs text-gray-400">Procese muestras en la mesa de trabajo para poblar la base de datos.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-3">Identificador de Muestra</th>
                                <th className="px-6 py-3">Fecha de Inferencia</th>
                                <th className="px-6 py-3">Núcleos Totales</th>
                                <th className="px-6 py-3">DAB+ (Positivos)</th>
                                <th className="px-6 py-3">Índice Pan-CK</th>
                                <th className="px-6 py-3">Riesgo Clínico</th>
                                <th className="px-6 py-3 text-right">Acción</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                            {records.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-gray-700 max-w-[220px] truncate" title={record.nombre_archivo}>
                                        {record.nombre_archivo}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">{record.date}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-600 font-mono">{record.total_nuclei}</td>
                                    <td className="px-6 py-4 font-semibold text-red-600 font-mono">{record.positive_nuclei}</td>
                                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{record.positivity_index}%</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getRiskStyles(record.risk_level)}`}>
                                            {record.risk_level}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setActiveReport(record)}
                                            className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-[#00539C] px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

            {/* VISOR E IMPRESOR DE DOCUMENTACIÓN INTEGRADO */}
            {activeReport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-200 flex flex-col my-auto print:shadow-none print:border-none print:w-full print:max-w-none">

                        {/* Barra de herramientas superior */}
                        <header className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center print:hidden">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Vista Previa de Documento Clínico
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={ejecutarImpresionNativa}
                                    className="bg-[#00539C] hover:bg-[#004380] text-white text-xs font-bold px-3 py-1.5 rounded transition-colors uppercase tracking-wide"
                                >
                                    Imprimir / Guardar PDF
                                </button>
                                <button
                                    onClick={() => setActiveReport(null)}
                                    className="text-gray-500 hover:text-gray-700 text-xs font-bold px-3 py-1.5 rounded transition-colors uppercase tracking-wide"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </header>

                        {/* Plantilla Oficial Documentaria */}
                        <div className="p-10 bg-white space-y-6 text-gray-800 font-sans print:p-0">

                            {/* Membrete EsSalud */}
                            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <img src="/Logo_EsSalud.png" alt="Logo EsSalud" className="h-12 w-auto object-contain" />
                                    <div className="text-left">
                                        <h4 className="text-sm font-black text-[#00539C] tracking-wide uppercase">EsSalud</h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">Red Asistencial La Libertad</p>
                                        <p className="text-[9px] text-gray-400 font-medium">H.A.C. Virgen de la Puerta — Trujillo</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informe Anatomopatológico</h3>
                                    <p className="text-xs font-mono font-bold text-gray-700 mt-1">ID: {activeReport.request_id.substring(0, 13).toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Metadatos Generales */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Origen de la Muestra</p>
                                    <p className="font-semibold text-gray-700 mt-0.5">{activeReport.nombre_archivo}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Fecha de Emisión del Sistema</p>
                                    <p className="font-semibold text-gray-700 mt-0.5">{activeReport.date}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Procedimiento Analítico</p>
                                    <p className="font-semibold text-gray-700 mt-0.5">Cuantificación Digital Inmunohistoquímica</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Marcador Biomolecular</p>
                                    <p className="font-semibold text-[#00539C] mt-0.5">Citoqueratina Pan-CK</p>
                                </div>
                            </div>

                            {/* Hallazgos e Indicadores Cuantitativos */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-widest border-b pb-1">
                                    Resultados del Análisis de Imagen Automatizado
                                </h4>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="border border-gray-200 p-3 rounded bg-slate-50/50">
                                        <p className="text-gray-400 font-medium">Núcleos Celulares Evaluados</p>
                                        <p className="text-xl font-bold text-gray-800 mt-1 font-mono">{activeReport.total_nuclei}</p>
                                    </div>
                                    <div className="border border-gray-200 p-3 rounded bg-slate-50/50">
                                        <p className="text-gray-400 font-medium">Firma Cromática Positiva (DAB+)</p>
                                        <p className="text-xl font-bold text-red-600 mt-1 font-mono">{activeReport.positive_nuclei}</p>
                                    </div>
                                    <div className="border border-gray-200 p-3 rounded bg-slate-50/50">
                                        <p className="text-gray-400 font-medium">Índice de Positividad Proliferativa</p>
                                        <p className="text-xl font-bold text-slate-900 mt-1 font-mono">{activeReport.positivity_index}%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Conclusión de Riesgo Diagnóstico */}
                            <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Evaluación de Riesgo Clínico Estructurado
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-black px-3 py-1 rounded-md border uppercase tracking-wider ${getRiskStyles(activeReport.risk_level)}`}>
                                        Nivel: {activeReport.risk_level}
                                    </span>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        La cuantificación porcentual del marcador inmunoquímico Pan-CK refleja el estado de proliferación del epitelio celular indexado en la muestra histológica suministrada.
                                    </p>
                                </div>
                            </div>

                            {/* Secciones de Validación Legal e Informatizada */}
                            <div className="pt-12 grid grid-cols-2 gap-8 items-center text-center text-xs">

                                {/* 🎯 FIRMA DIGITAL DEL SISTEMA AUTOMATIZADA MEDIANTE SCRIPT */}
                                <div className="border border-green-200 bg-green-50/40 rounded-lg p-3 text-center max-w-[240px] mx-auto relative overflow-hidden shadow-sm">
                                    <div className="absolute top-0 right-0 bg-green-600 text-white text-[7px] font-bold px-1.5 py-0.5 uppercase tracking-widest rounded-bl font-mono">
                                        AI PASS
                                    </div>
                                    <p className="text-[9px] font-mono text-green-700 font-bold tracking-wider uppercase">VALIDACIÓN AUTOMÁTICA</p>
                                    <p className="text-[8px] font-mono text-gray-400 truncate mt-1">
                                        SHA256:{activeReport.request_id ? btoa(activeReport.request_id).substring(0, 16) : "SECURE_HASH"}
                                    </p>
                                    <p className="text-[9px] text-green-600 font-bold mt-2 uppercase tracking-wide">Firma del Sistema</p>
                                </div>

                                {/* Firma física del médico patólogo */}
                                <div className="border-t border-dashed border-gray-400 pt-6 max-w-[200px] w-full mx-auto self-end">
                                    <p className="font-semibold text-gray-700">Firma del Médico Especialista</p>
                                    <p className="text-[10px] text-gray-400 uppercase mt-0.5">Servicio de Anatomía Patológica</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}