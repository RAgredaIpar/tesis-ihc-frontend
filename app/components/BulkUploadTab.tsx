"use client";

import { useState, DragEvent, ChangeEvent } from "react";

interface QueueItem {
    id: number;
    name: string;
    file: File;
    status: "espera" | "procesando" | "completado" | "error";
    errorDetail?: string; // <-- NUEVO: Captura el motivo exacto del rechazo biológico del backend
    syntheticIhc: string | null;
    auditCanvas: string | null;
    scoreCam: string | null;
    positivityIndex: number | null;
    riskLevel: string | null;
    riskColor: string | null;
}

type ModalViewType = "IHC Sintética" | "Auditoría HSV" | "Score-CAM";

export default function BulkUploadTab() {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const [activeModalItem, setActiveModalItem] = useState<QueueItem | null>(null);
    const [modalViewTab, setModalViewTab] = useState<ModalViewType>("IHC Sintética");

    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [showCheck, setShowCheck] = useState<boolean>(false);

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const agregarArchivosACola = (files: FileList) => {
        const filesArray = Array.from(files);
        const extensionesPermitidas = [".png", ".jpg", ".jpeg", ".tif", ".tiff"];

        const archivosValidos = filesArray.filter((file) => {
            const nombreMinuscula = file.name.toLowerCase();
            return extensionesPermitidas.some((ext) => nombreMinuscula.endsWith(ext));
        });

        if (archivosValidos.length < filesArray.length) {
            alert(
                "⚠️ Formato no permitido: Se detectaron archivos inválidos. Solo se añadieron a la cola las imágenes histopatológicas (.png, .jpg, .jpeg, .tif, .tiff)."
            );
        }

        if (archivosValidos.length === 0) return;

        const newItems: QueueItem[] = archivosValidos.map((file, index) => ({
            id: Date.now() + index,
            name: file.name,
            file: file,
            status: "espera",
            syntheticIhc: null,
            auditCanvas: null,
            scoreCam: null,
            positivityIndex: null,
            riskLevel: null,
            riskColor: null,
        }));

        setQueue((prev) => [...prev, ...newItems]);
        setShowCheck(true);

        setTimeout(() => {
            setShowCheck(false);
        }, 2000);
    };

    const handleFolderSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            agregarArchivosACola(e.target.files);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            agregarArchivosACola(e.dataTransfer.files);
        }
    };

    const procesarLote = async () => {
        if (queue.length === 0 || isProcessing) return;

        setIsProcessing(true);
        const updatedQueue = [...queue];

        for (let i = 0; i < updatedQueue.length; i++) {
            if (updatedQueue[i].status === "completado" || updatedQueue[i].status === "error") continue;

            updatedQueue[i].status = "procesando";
            setQueue([...updatedQueue]);

            const formData = new FormData();
            formData.append("file", updatedQueue[i].file);

            try {
                const response = await fetch(`${BACKEND_URL}/api/quantify`, {
                    method: "POST",
                    body: formData,
                    headers: {
                        "ngrok-skip-browser-warning": "true"
                    }
                });

                // Captura el error estructurado del backend (ej: el filtro espectral 422)
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || "Error en el procesamiento analítico local.");
                }

                const data = await response.json();

                if (data.status === "success") {
                    updatedQueue[i].status = "completado";
                    updatedQueue[i].syntheticIhc = data.visual_payloads.synthetic_ihc_url;
                    updatedQueue[i].auditCanvas = data.visual_payloads.audit_canvas_url;
                    updatedQueue[i].scoreCam = data.visual_payloads.score_cam_url;
                    updatedQueue[i].positivityIndex = data.analytics.positivity_index_percentage;
                    updatedQueue[i].riskLevel = data.clinical_risk.level;
                    updatedQueue[i].riskColor = data.clinical_risk.color_code;
                } else {
                    updatedQueue[i].status = "error";
                    updatedQueue[i].errorDetail = "Respuesta incompleta del servidor.";
                }
            } catch (err: any) {
                console.error(err);
                updatedQueue[i].status = "error";
                updatedQueue[i].errorDetail = err.message || "Error crítico de conexión.";
            }

            setQueue([...updatedQueue]);
        }

        setIsProcessing(false);
    };

    const limpiarCola = () => {
        if (isProcessing) return;
        setQueue([]);
    };

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-slide">

            {/* PANEL IZQUIERDO */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                        Panel de Control por Lotes
                    </h3>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                            isDragging ? 'border-[#00AEEF] bg-blue-50 scale-[1.02]' :
                                queue.length > 0 && !showCheck ? 'border-[#00539C] bg-[#F4F9FD]' :
                                    'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                        <input
                            type="file"
                            multiple
                            accept=".png,.jpg,.jpeg,.tif,.tiff"
                            onChange={handleFolderSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={isProcessing}
                        />

                        {showCheck ? (
                            <div className="flex flex-col items-center justify-center">
                                <svg className="h-16 w-16 mb-2" viewBox="0 0 52 52">
                                    <circle className="stroke-green-500 fill-none" strokeWidth="4" cx="26" cy="26" r="24" style={{ animation: "drawCircle 0.6s ease-out forwards" }} />
                                    <path className="stroke-green-500 fill-none" strokeWidth="4" d="M14.1 27.2l7.1 7.2 16.7-16.8" style={{ animation: "drawCheck 0.4s ease-out 0.6s forwards" }} />
                                </svg>
                                <p className="text-sm font-bold text-green-600">Lote anexado</p>
                            </div>
                        ) : queue.length > 0 ? (
                            <div className="flex flex-col items-center justify-center">
                                <svg className="h-10 w-10 text-[#00539C] mb-3 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <p className="text-sm text-[#00539C] font-bold">Lote listo en memoria</p>
                                <p className="text-xs text-gray-400 mt-2">Haz clic o arrastra para añadir más muestras</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center">
                                <svg className={`h-10 w-10 mb-4 transition-colors ${isDragging ? 'text-[#00AEEF]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm text-gray-600 font-medium">
                                    {isDragging ? 'Suelte las imágenes aquí' : 'Arrastre las láminas o haga clic para explorar'}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">Formatos soportados: JPG, PNG, TIF, TIFF</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 mt-4">
                        <button
                            onClick={procesarLote}
                            disabled={isProcessing || queue.length === 0}
                            className="w-full bg-[#00539C] hover:bg-[#004380] text-white font-bold text-sm py-3 px-4 rounded transition-colors disabled:bg-gray-200 disabled:text-gray-400 uppercase tracking-wide shadow-sm"
                        >
                            {isProcessing ? "Procesando Lote en GPU..." : "Iniciar Diagnóstico Virtual Masivo"}
                        </button>
                        <button
                            onClick={limpiarCola}
                            disabled={isProcessing || queue.length === 0}
                            className="w-full bg-white hover:bg-gray-50 text-gray-500 font-medium text-xs py-2 px-4 rounded border border-gray-200 transition-colors"
                        >
                            Limpiar Cola de Espera
                        </button>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 text-xs space-y-3">
                    <h4 className="font-bold text-gray-400 uppercase tracking-widest border-b pb-2">Resumen del Lote</h4>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Total en cola:</span>
                        <span className="font-bold font-mono">{queue.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Procesados:</span>
                        <span className="font-bold text-green-600 font-mono">
                            {queue.filter((item) => item.status === "completado").length}
                        </span>
                    </div>
                </div>
            </aside>

            {/* PANEL DERECHO: COLA DE PROCESAMIENTO */}
            <section className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <header className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                        Cola de Diagnóstico por Lotes
                    </h3>
                </header>

                {isProcessing && (
                    <div className="w-full bg-gray-100 h-1.5 overflow-hidden relative border-b border-gray-200">
                        <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-[#00AEEF] via-white to-[#00AEEF] animate-shimmer-bar opacity-80" />
                    </div>
                )}

                <div className="flex-1 p-4 max-h-[600px] overflow-y-auto divide-y divide-gray-100">
                    {queue.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <p className="text-xs uppercase tracking-widest font-medium">No hay muestras en cola</p>
                        </div>
                    ) : (
                        queue.map((item) => (
                            <div key={item.id} className="py-3.5 flex justify-between items-center gap-4 group animate-fade-slide hover:bg-slate-50/60 px-2 rounded-lg transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                                    {item.status === "completado" && (
                                        <p className="text-[11px] font-bold mt-0.5" style={{ color: item.riskColor || '#000' }}>
                                            Índice Pan-CK: {item.positivityIndex}% — {item.riskLevel}
                                        </p>
                                    )}
                                    {/* MUESTRA LA ADVERTENCIA ESPECÍFICA ABAJO EN COLOR ROJO SI EL BACKEND RECHAZA EL ARCHIVO */}
                                    {item.status === "error" && item.errorDetail && (
                                        <p className="text-[11px] font-semibold mt-0.5 text-red-500">
                                            ⚠️ {item.errorDetail}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                        item.status === "completado" ? "bg-green-50 text-green-700 border border-green-100" :
                                            item.status === "procesando" ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse" :
                                                item.status === "error" ? "bg-red-50 text-red-700 border border-red-100" :
                                                    "bg-gray-50 text-gray-500 border border-gray-100"
                                    }`}>
                                        {item.status === "espera" ? "En cola" : item.status}
                                    </span>

                                    {item.status === "completado" && item.syntheticIhc && (
                                        <button
                                            onClick={() => {
                                                setActiveModalItem(item);
                                                setModalViewTab("IHC Sintética");
                                            }}
                                            className="text-xs font-bold text-[#00539C] bg-blue-50 border border-blue-200/60 hover:bg-[#00539C] hover:text-white px-3 py-1.5 rounded transition-all shadow-sm"
                                        >
                                            Ver Reporte
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* --- VISOR INTERACTIVO EN MODAL --- */}
            {activeModalItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden border border-gray-100 flex flex-col">

                        <header className="bg-[#00539C] px-6 pt-3 flex justify-between items-end border-b-2 border-[#004380]">
                            <div className="flex items-end gap-1">
                                <button
                                    onClick={() => setModalViewTab("IHC Sintética")}
                                    className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors ${
                                        modalViewTab === "IHC Sintética" ? "bg-white text-[#00539C]" : "bg-[#004380] text-blue-200 hover:bg-[#003B70]"
                                    }`}
                                >
                                    IHC Sintética
                                </button>
                                <button
                                    onClick={() => setModalViewTab("Auditoría HSV")}
                                    className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors ${
                                        modalViewTab === "Auditoría HSV" ? "bg-white text-[#00539C]" : "bg-[#004380] text-blue-200 hover:bg-[#003B70]"
                                    }`}
                                >
                                    Auditoría HSV
                                </button>
                                <button
                                    onClick={() => setModalViewTab("Score-CAM")}
                                    className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors ${
                                        modalViewTab === "Score-CAM" ? "bg-white text-[#00539C]" : "bg-[#004380] text-blue-200 hover:bg-[#003B70]"
                                    }`}
                                >
                                    Score-CAM (XAI)
                                </button>
                            </div>
                            <button
                                onClick={() => setActiveModalItem(null)}
                                className="text-white hover:text-blue-100 text-xs font-bold pb-2.5 tracking-wider uppercase transition-colors"
                            >
                                Cerrar Visor ✕
                            </button>
                        </header>

                        <div className="bg-gray-100 p-6 flex flex-col md:flex-row gap-6 items-stretch justify-center max-h-[550px] overflow-y-auto">

                            <div className="flex-1 flex items-center justify-center bg-[#E2E8F0] rounded-xl border border-gray-200 p-2 min-h-[380px] relative overflow-hidden">
                                <img
                                    src={
                                        modalViewTab === "IHC Sintética"
                                            ? activeModalItem.syntheticIhc!
                                            : modalViewTab === "Auditoría HSV"
                                                ? activeModalItem.auditCanvas!
                                                : activeModalItem.scoreCam!
                                    }
                                    alt="Resultado Lote"
                                    className="max-w-full max-h-[380px] object-contain animate-fade-slide"
                                />
                            </div>

                            <div className="w-full md:w-72 space-y-4 text-sm bg-white p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Identificador de Muestra</span>
                                        <p className="font-semibold text-gray-700 truncate mt-0.5">{activeModalItem.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Índice Proliferativo</span>
                                        <p className="text-3xl font-black mt-0.5" style={{ color: activeModalItem.riskColor || '#000' }}>
                                            {activeModalItem.positivityIndex}%
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categoría Diagnóstica</span>
                                        <div className="mt-1">
                                            <span className="font-bold uppercase text-[11px] px-2.5 py-1 rounded-md border border-gray-200 bg-slate-50" style={{ color: activeModalItem.riskColor || '#000' }}>
                                                {activeModalItem.riskLevel}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setActiveModalItem(null)}
                                    className="w-full bg-[#00539C] hover:bg-[#004380] text-white font-bold text-xs py-2.5 px-4 rounded transition-colors uppercase tracking-wide mt-4 shadow-sm"
                                >
                                    Volver a la Lista
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}