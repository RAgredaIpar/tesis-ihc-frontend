"use client";

import { useState } from "react";
import { Client } from "@gradio/client";
import UploadZone from "@/app/components/UploadZone";

interface Metrics {
    time: string;
    resolution: string;
    status: string;
}

interface Results {
    unet: string | null;
    pix2pix: string | null;
}

type ModelType = "U-Net PRO (M2)" | "Pix2Pix (M1)";

export default function WorkspaceTab() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [results, setResults] = useState<Results>({ unet: null, pix2pix: null });
    const [loading, setLoading] = useState<boolean>(false);
    const [activeModelTab, setActiveModelTab] = useState<ModelType>("U-Net PRO (M2)");

    const [metrics, setMetrics] = useState<Metrics>({
        time: "0.00",
        resolution: "-",
        status: "En espera"
    });

    const handleFile = (selectedFile: File) => {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setResults({ unet: null, pix2pix: null });

        const img = new Image();
        img.src = URL.createObjectURL(selectedFile);
        img.onload = () => {
            setMetrics({ ...metrics, resolution: `${img.width}x${img.height} px`, status: "Lista para análisis" });
        };
    };

    const procesarLamina = async () => {
        if (!file) return;
        setLoading(true);
        setMetrics(prev => ({ ...prev, status: "Ejecutando inferencia dual..." }));

        const startTime = performance.now();

        try {
            const client = await Client.connect("Rhfjfgzrdg/tesis-ihc-backend");

            const [resUnet, resPix] = await Promise.all([
                client.predict("/procesar_imagen", { imagen_he: file, modelo_seleccionado: "U-Net PRO (M2)" }) as Promise<{ data: { url: string }[] }>,
                client.predict("/procesar_imagen", { imagen_he: file, modelo_seleccionado: "Pix2Pix (M1)" }) as Promise<{ data: { url: string }[] }>
            ]);

            const endTime = performance.now();
            const timeInSeconds = ((endTime - startTime) / 1000).toFixed(2);

            if (resUnet.data && resPix.data) {
                setResults({
                    unet: resUnet.data[0].url,
                    pix2pix: resPix.data[0].url
                });
                setMetrics(prev => ({
                    ...prev,
                    time: timeInSeconds,
                    status: "Completado"
                }));
            } else {
                throw new Error("Respuesta inválida de la API");
            }

        } catch (error) {
            console.error(error);
            setMetrics(prev => ({ ...prev, status: "Error de red" }));
        } finally {
            setLoading(false);
        }
    };

    const currentResultImage = activeModelTab === "U-Net PRO (M2)" ? results.unet : results.pix2pix;

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-slide">
            <aside className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <UploadZone onFileSelect={handleFile} loading={loading} />
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
                            <span className="text-gray-500">Modelo Activo</span>
                            <span className="font-semibold text-[#00539C] bg-blue-50 px-2 py-1 rounded">
                                {activeModelTab}
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
                            <span className={`text-xs font-bold px-2 py-1 rounded ${metrics.status === 'Completado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {metrics.status}
                            </span>
                        </li>
                    </ul>
                </div>
            </aside>

            <section className="lg:col-span-8 flex flex-col gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="bg-[#00539C] px-3 pt-3 flex justify-between items-end border-b-2 border-[#004380]">
                        <div className="flex items-end gap-1">
                            <button
                                onClick={() => setActiveModelTab("U-Net PRO (M2)")}
                                className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors ${
                                    activeModelTab === "U-Net PRO (M2)" ? "bg-white text-[#00539C]" : "bg-[#004380] text-blue-200 hover:bg-[#003B70]"
                                }`}
                            >
                                U-Net PRO
                            </button>
                            <button
                                onClick={() => setActiveModelTab("Pix2Pix (M1)")}
                                className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors ${
                                    activeModelTab === "Pix2Pix (M1)" ? "bg-white text-[#00539C]" : "bg-[#004380] text-blue-200 hover:bg-[#003B70]"
                                }`}
                            >
                                Pix2Pix Base
                            </button>
                        </div>

                        <div className="pb-2 hidden sm:flex items-center gap-2 opacity-80">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-white text-xs font-bold uppercase tracking-widest">
                                Visor Principal
                            </span>
                        </div>
                    </div>

                    <div className="bg-[#E2E8F0] h-[500px] flex items-center justify-center relative overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 border-4 border-gray-300 border-t-[#00539C] rounded-full animate-spin"></div>
                                <span className="text-sm font-bold text-[#00539C] uppercase tracking-widest animate-pulse">Sintetizando IHC...</span>
                            </div>
                        ) : currentResultImage ? (
                            <img
                                key={activeModelTab}
                                src={currentResultImage}
                                alt={`Resultado ${activeModelTab}`}
                                className="w-full h-full object-contain animate-fade-slide"
                            />
                        ) : (
                            <div className="text-gray-400 flex flex-col items-center gap-3">
                                <svg className="w-12 h-12 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm uppercase tracking-widest font-medium">Panel de Visualización Inactivo</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Referencia Morfológica (H&E)
                        </h3>
                        {preview && (
                            <button
                                onClick={() => window.open(preview, '_blank')}
                                className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded transition-colors"
                            >
                                Abrir en nueva pestaña
                            </button>
                        )}
                    </div>

                    <div className="h-64 w-full bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative group">
                        {preview ? (
                            <img
                                src={preview}
                                alt="Entrada H&E"
                                className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                        ) : (
                            <div className="text-center p-4">
                                <p className="text-xs text-gray-400 font-bold uppercase">Esperando carga de muestra</p>
                            </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            Ajustado al contenedor
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}