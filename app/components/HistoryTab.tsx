"use client";

import { useState } from "react";

interface HistoryRecord {
    id: string;
    patientCode: string;
    date: string;
    tissue: string;
    modelUsed: string;
    diceResult: string;
    status: "Firmado" | "Pendiente de Revisión";
}

export default function HistoryTab() {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // Datos simulados con contexto local de Trujillo
    const [records] = useState<HistoryRecord[]>([
        {
            id: "REC-001",
            patientCode: "TRU-IHC-7421",
            date: "25/05/2026 14:22",
            tissue: "Gástrico (Cuerpo)",
            modelUsed: "U-Net PRO (M2)",
            diceResult: "0.82",
            status: "Firmado"
        },
        {
            id: "REC-002",
            patientCode: "TRU-IHC-9012",
            date: "25/05/2026 11:05",
            tissue: "Colon Descendente",
            modelUsed: "U-Net PRO (M2)",
            diceResult: "0.79",
            status: "Firmado"
        },
        {
            id: "REC-003",
            patientCode: "TRU-IHC-3345",
            date: "24/05/2026 16:40",
            tissue: "Pulmonar (Lóbulo Sup.)",
            modelUsed: "Pix2Pix (M1)",
            diceResult: "0.69",
            status: "Pendiente de Revisión"
        },
        {
            id: "REC-004",
            patientCode: "TRU-IHC-1128",
            date: "23/05/2026 09:15",
            tissue: "Gástrico (Antro)",
            modelUsed: "U-Net PRO (M2)",
            diceResult: "0.81",
            status: "Firmado"
        }
    ]);

    // Simulación interactiva de generación de PDF médico
    const handleDownloadReport = (id: string) => {
        setDownloadingId(id);
        setTimeout(() => {
            setDownloadingId(null);
            alert(`Reporte clínico ${id} generado exitosamente. Iniciando descarga de documentación médica indexada.`);
        }, 1500);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-slide">

            {/* CABECERA */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                        Archivo Digital de Pacientes
                    </h3>
                    <span className="text-[10px] bg-blue-50 text-[#00539C] px-2 py-0.5 rounded font-bold uppercase">
            Total Almacenado: {records.length}
          </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            <th className="px-6 py-3">Código Paciente</th>
                            <th className="px-6 py-3">Fecha de Inferencia</th>
                            <th className="px-6 py-3">Tipo de Tejido</th>
                            <th className="px-6 py-3">Arquitectura Empleada</th>
                            <th className="px-6 py-3">Métrica local (Dice)</th>
                            <th className="px-6 py-3">Validación Patológica</th>
                            <th className="px-6 py-3 text-right">Acción</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                        {records.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-4 font-mono font-bold text-gray-700">{record.patientCode}</td>
                                <td className="px-6 py-4 text-xs text-gray-500">{record.date}</td>
                                <td className="px-6 py-4 font-medium text-gray-600">{record.tissue}</td>
                                <td className="px-6 py-4 text-xs text-[#00539C] font-semibold">{record.modelUsed}</td>
                                <td className="px-6 py-4 font-mono text-xs">{record.diceResult}</td>
                                <td className="px-6 py-4">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        record.status === "Firmado"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}>
                      {record.status}
                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDownloadReport(record.id)}
                                        disabled={downloadingId !== null}
                                        className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-[#00539C] px-3 py-1.5 rounded text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                                    >
                                        {downloadingId === record.id ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-gray-300 border-t-[#00539C] rounded-full animate-spin"></div>
                                                Generando...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Reporte PDF
                                            </>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}