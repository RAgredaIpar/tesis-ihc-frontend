"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; // 🎯 Inyección de persistencia para la Fase 3
import UploadZone from "@/app/components/UploadZone";
import {guardarDiagnostico} from "@/app/actions/auth";

interface Metrics {
    time: string;
    resolution: string;
    status: string;
}

// Estructura de datos ampliada que recibe la IHC, Auditoría HSV y el Mapa de Calor
interface QuantifyResponse {
    status: string;
    metadata: {
        request_id: string;
        original_filename: string;
    };
    analytics: {
        total_nuclei_detected: number;
        positive_nuclei_count: number;
        negative_nuclei_count: number;
        positivity_index_percentage: number;
    };
    clinical_risk: {
        level: string;
        color_code: string;
        description: string;
    };
    visual_payloads: {
        synthetic_ihc_url: string;
        audit_canvas_url: string;
        score_cam_url: string; // Canal para recibir la matriz XAI interpretada
    };
}

// Agregamos Score-CAM como un tipo de vista admitido por el componente
type ViewType = "IHC Sintética" | "Auditoría HSV" | "Score-CAM";

export default function WorkspaceTab() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [apiResult, setApiResult] = useState<QuantifyResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [activeViewTab, setActiveViewTab] = useState<ViewType>("IHC Sintética");

    const [metrics, setMetrics] = useState<Metrics>({
        time: "0.00",
        resolution: "-",
        status: "En espera"
    });

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Modificado para retornar boolean y solucionar el error de TypeScript TS2322
    const handleFile = (selectedFile: File): boolean => {
        const extensionesPermitidas = [".png", ".jpg", ".jpeg", ".tif", ".tiff"];
        const nombreMinuscula = selectedFile.name.toLowerCase();
        const esValido = extensionesPermitidas.some((ext) => nombreMinuscula.endsWith(ext));

        if (!esValido) {
            alert("⚠️ Muestra digital rechazada. El sistema solo admite archivos de imagen médica en formato .png, .jpg, .jpeg, .tif o .tiff.");
            return false; // Frena la animación en UploadZone
        }

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setApiResult(null);
        setActiveViewTab("IHC Sintética");

        const img = new Image();
        img.src = URL.createObjectURL(selectedFile);
        img.onload = () => {
            setMetrics({...metrics, resolution: `${img.width}x${img.height} px`, status: "Lista para análisis"});
        };

        return true; // Autentica el archivo y activa el check en UploadZone
    };

    const procesarLamina = async () => {
        if (!file) return;
        setLoading(true);
        setMetrics(prev => ({...prev, status: "Procesando en GPU..."}));

        const startTime = performance.now();
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch(`${BACKEND_URL}/api/quantify`, {
                method: "POST",
                body: formData,
                headers: {
                    "ngrok-skip-browser-warning": "true"
                }
            });

            // MANEJO DE ERRORES AVANZADO: Extrae la razón exacta (detail) del error del backend
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Error en la inferencia del pipeline local");
            }

            const data: QuantifyResponse = await response.json();
            const endTime = performance.now();
            const timeInSeconds = ((endTime - startTime) / 1000).toFixed(2);

            setApiResult(data);
            setMetrics(prev => ({
                ...prev,
                time: timeInSeconds,
                status: "Completado"
            }));

            try {
                const resGuardado = await guardarDiagnostico({
                    request_id: data.metadata.request_id,
                    nombre_archivo: data.metadata.original_filename,
                    total_nuclei: data.analytics.total_nuclei_detected,
                    positive_nuclei: data.analytics.positive_nuclei_count,
                    positivity_index: data.analytics.positivity_index_percentage,
                    risk_level: data.clinical_risk.level
                });

                if (!resGuardado.success) {
                    console.error("Fallo detectado en Server Action:", resGuardado.error);
                }
            } catch (dbErr: any) {
                console.error("Fallo al invocar la Server Action de persistencia:", dbErr.message);
            }

        } catch (error: any) {
            console.error(error);
            setMetrics(prev => ({...prev, status: error.message || "Error de conexión"}));
        } finally {
            setLoading(false);
        }
    };

    // Conmutador condicional de tres vías optimizado para lectura de Base64
    const currentResultImage = apiResult
        ? (activeViewTab === "IHC Sintética"
            ? apiResult.visual_payloads.synthetic_ihc_url
            : activeViewTab === "Auditoría HSV"
                ? apiResult.visual_payloads.audit_canvas_url
                : apiResult.visual_payloads.score_cam_url)
        : null;

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-slide">

            {/* COLUMNA IZQUIERDA: CONTROLES Y MÉTRICAS */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <UploadZone onFileSelect={handleFile} loading={loading}/>
                    <button
                        onClick={procesarLamina}
                        disabled={loading || !file}
                        className="w-full mt-6 bg-[#00539C] hover:bg-[#004380] text-white font-bold text-sm py-3 px-4 rounded transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed uppercase tracking-wide shadow-sm"
                    >
                        {loading ? "Procesando Lámina..." : "Iniciar Diagnóstico Virtual"}
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b pb-2">
                        Métricas de Inferencia
                    </h3>
                    <ul className="space-y-3 text-sm">
                        <li className="flex justify-between items-center">
                            <span className="text-gray-500">Pipeline de IA</span>
                            <span className="font-semibold text-[#00539C] bg-blue-50 px-2 py-1 rounded text-xs">
                                U-Net PRO + G51
                            </span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className="text-gray-500">Resolución Fuente</span>
                            <span className="font-mono">{metrics.resolution}</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className="text-gray-500">Tiempo de Cómputo</span>
                            <span className="font-mono font-bold">{metrics.time} s</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className="text-gray-500">Estado</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded max-w-[180px] truncate ${
                                metrics.status === 'Completado'
                                    ? 'bg-green-100 text-green-700'
                                    : metrics.status.includes('Error') || metrics.status.includes('inválida') || metrics.status.includes('rechazada')
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-600'
                            }`}>
                                {metrics.status.includes('Error') || metrics.status.includes('inválida') || metrics.status.includes('rechazada')
                                    ? 'Muestra denegada'
                                    : metrics.status}
                            </span>
                        </li>
                    </ul>
                </div>
            </aside>

            {/* COLUMNA DERECHA: VISOR PRINCIPAL Y REPORTE CLÍNICO */}
            <section className="lg:col-span-8 flex flex-col gap-6">

                {/* RECUADRO DEL VISOR IMAGEN MULTI-TAB */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="bg-[#00539C] px-3 pt-3 flex justify-between items-end border-b-2 border-[#004380]">
                        <div className="flex items-end gap-1">
                            <button
                                onClick={() => setActiveViewTab("IHC Sintética")}
                                className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors ${
                                    activeViewTab === "IHC Sintética" ? "bg-white text-[#00539C]" : "bg-[#004380] text-blue-200 hover:bg-[#003B70]"
                                }`}
                            >
                                IHC Sintética
                            </button>
                            <button
                                onClick={() => setActiveViewTab("Auditoría HSV")}
                                className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors ${
                                    activeViewTab === "Auditoría HSV" ? "bg-white text-[#00539C]" : "bg-[#004380] text-blue-200 hover:bg-[#003B70]"
                                }`}
                            >
                                Auditoría HSV
                            </button>
                            <button
                                onClick={() => setActiveViewTab("Score-CAM")}
                                className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors ${
                                    activeViewTab === "Score-CAM" ? "bg-white text-[#00539C]" : "bg-[#004380] text-blue-200 hover:bg-[#003B70]"
                                }`}
                            >
                                Score-CAM (XAI)
                            </button>
                        </div>

                        <div className="pb-2 hidden sm:flex items-center gap-2 opacity-80">
                            <span className="text-white text-xs font-bold uppercase tracking-widest">
                                Vista: {activeViewTab}
                            </span>
                        </div>
                    </div>

                    <div className="bg-[#E2E8F0] h-[500px] flex items-center justify-center relative overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    className="w-12 h-12 border-4 border-gray-300 border-t-[#00539C] rounded-full animate-spin"></div>
                                <span
                                    className="text-sm font-bold text-[#00539C] uppercase tracking-widest animate-pulse">Sintetizando y analizando matrices...</span>
                            </div>
                        ) : currentResultImage ? (
                            <img
                                key={activeViewTab}
                                src={currentResultImage}
                                alt={`Resultado ${activeViewTab}`}
                                className="w-full h-full object-contain animate-fade-slide"
                            />
                        ) : (
                            <div className="text-gray-400 flex flex-col items-center gap-3">
                                <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24"
                                     stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                                <span className="text-sm uppercase tracking-widest font-medium">Visor Inactivo - Ejecute el Diagnóstico</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* REPORTE MOLECULAR INTEGRADO */}
                {apiResult && (
                    <div
                        className="bg-white p-6 rounded-xl shadow-sm border-t-4 transition-all grid grid-cols-1 md:grid-cols-3 gap-6"
                        style={{borderTopColor: apiResult.clinical_risk.color_code}}
                    >
                        <div
                            className="md:col-span-1 border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-4 flex flex-col justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Riesgo Proliferativo</span>
                            <h4 className="text-2xl font-black mt-0.5"
                                style={{color: apiResult.clinical_risk.color_code}}>
                                {apiResult.clinical_risk.level}
                            </h4>
                            <div className="mt-4">
                                <span className="text-4xl font-extrabold tracking-tight text-gray-900">
                                    {apiResult.analytics.positivity_index_percentage}%
                                </span>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Índice Pan-CK Calibrado</p>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                            <p className="text-sm text-gray-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                                {apiResult.clinical_risk.description}
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-slate-50 p-2 rounded border border-gray-100">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Detectadas</p>
                                    <p className="text-lg font-bold text-gray-800">{apiResult.analytics.total_nuclei_detected}</p>
                                </div>
                                <div className="bg-red-50 p-2 rounded border border-red-100">
                                    <p className="text-[10px] text-red-400 font-bold uppercase">DAB+ (Tumor)</p>
                                    <p className="text-lg font-bold text-red-600">{apiResult.analytics.positive_nuclei_count}</p>
                                </div>
                                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                    <p className="text-[10px] text-blue-400 font-bold uppercase">H- (Sanas)</p>
                                    <p className="text-lg font-bold text-blue-600">{apiResult.analytics.negative_nuclei_count}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* REFERENCIA MORFOLÓGICA (SU IMAGEN ORIGINAL) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Referencia de Entrada (Canal Hematoxilina / Filtro)
                        </h3>
                    </div>

                    <div
                        className="h-64 w-full bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative group">
                        {preview ? (
                            <img
                                src={preview}
                                alt="Entrada Seleccionada"
                                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                        ) : (
                            <div className="text-center p-4">
                                <p className="text-xs text-gray-400 font-bold uppercase">Esperando carga de muestra</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}