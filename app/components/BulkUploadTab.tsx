"use client";

import { useState, DragEvent, ChangeEvent } from "react";
import { Client } from "@gradio/client";

interface QueueItem {
    id: number;
    name: string;
    file: File;
    status: "espera" | "procesando" | "completado" | "error";
    resultUrl: string | null;
}

export default function BulkUploadTab() {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    // Estados de control de la UX (Idénticos a tu UploadZone)
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [showCheck, setShowCheck] = useState<boolean>(false);

    // Procesar e inflar la cola con los nuevos archivos cargados
    const agregarArchivosACola = (files: FileList) => {
        const filesArray = Array.from(files);
        const newItems: QueueItem[] = filesArray.map((file, index) => ({
            id: Date.now() + index,
            name: file.name,
            file: file,
            status: "espera",
            resultUrl: null,
        }));

        setQueue((prev) => [...prev, ...newItems]);
        setShowCheck(true);

        // Ocultar la animación de éxito tras 2 segundos
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

        try {
            const client = await Client.connect("Rhfjfgzrdg/tesis-ihc-backend");

            for (let i = 0; i < updatedQueue.length; i++) {
                if (updatedQueue[i].status === "completado") continue;

                updatedQueue[i].status = "procesando";
                setQueue([...updatedQueue]);

                try {
                    const res = (await client.predict("/procesar_imagen", {
                        imagen_he: updatedQueue[i].file,
                        modelo_seleccionado: "U-Net PRO (M2)",
                    })) as { data: { url: string }[] };

                    if (res.data && res.data.length > 0) {
                        updatedQueue[i].status = "completado";
                        updatedQueue[i].resultUrl = res.data[0].url;
                    } else {
                        updatedQueue[i].status = "error";
                    }
                } catch (err) {
                    console.error(`Error en archivo ${updatedQueue[i].name}:`, err);
                    updatedQueue[i].status = "error";
                }

                setQueue([...updatedQueue]);
            }
        } catch (error) {
            console.error("Error de conexión con el cluster de IA:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const limpiarCola = () => {
        if (isProcessing) return;
        setQueue([]);
    };

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-slide">

            {/* PANEL IZQUIERDO: CONTROLES DE CARGA */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                        Panel de Control por Lotes
                    </h3>

                    {/* DROPZONE TOTALMENTE HOMOLOGADO CON TUS ANIMACIONES COHERENTES */}
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
                            accept="image/*"
                            onChange={handleFolderSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={isProcessing}
                        />

                        {/* Caso A: Animación de Entrada Tipo Rappi */}
                        {showCheck ? (
                            <div className="flex flex-col items-center justify-center">
                                <svg className="h-16 w-16 mb-2" viewBox="0 0 52 52">
                                    <circle className="stroke-green-500 fill-none" strokeWidth="4" strokeDasharray="160"
                                            strokeDashoffset="160" cx="26" cy="26" r="24"
                                            style={{ animation: "drawCircle 0.6s ease-out forwards" }} />
                                    <path className="stroke-green-500 fill-none" strokeWidth="4" strokeDasharray="50"
                                          strokeDashoffset="50" d="M14.1 27.2l7.1 7.2 16.7-16.8"
                                          style={{ animation: "drawCheck 0.4s ease-out 0.6s forwards" }} />
                                </svg>
                                <p className="text-sm font-bold text-green-600">Lote anexado</p>
                                <style>{`
                  @keyframes drawCircle { to { stroke-dashoffset: 0; } }
                  @keyframes drawCheck { to { stroke-dashoffset: 0; } }
                `}</style>
                            </div>
                        ) : queue.length > 0 ? (
                            /* Caso B: Lote en memoria listo */
                            <div className="flex flex-col items-center justify-center">
                                <svg className="h-10 w-10 text-[#00539C] mb-3 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <p className="text-sm text-[#00539C] font-bold">Lote listo en memoria</p>
                                <p className="text-xs text-gray-400 mt-2">Haz clic o arrastra para añadir más muestras</p>
                            </div>
                        ) : (
                            /* Caso C: Estado por defecto vacío */
                            <div className="flex flex-col items-center justify-center">
                                <svg className={`h-10 w-10 mb-4 transition-colors ${isDragging ? 'text-[#00AEEF]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm text-gray-600 font-medium">
                                    {isDragging ? 'Suelte las imágenes aquí' : 'Arrastre las láminas o haga clic para explorar'}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">Permite múltiples archivos JPG o PNG</p>
                            </div>
                        )}
                    </div>

                    {/* Botones de acción del panel */}
                    <div className="space-y-2 mt-4">
                        <button
                            onClick={procesarLote}
                            disabled={isProcessing || queue.length === 0}
                            className="w-full bg-[#00539C] hover:bg-[#004380] text-white font-bold text-sm py-3 px-4 rounded transition-colors disabled:bg-gray-200 disabled:text-gray-400 uppercase tracking-wide shadow-sm"
                        >
                            {isProcessing ? "Procesando Lote..." : "Iniciar Tinción en Bloque"}
                        </button>
                        <button
                            onClick={limpiarCola}
                            disabled={isProcessing || queue.length === 0}
                            className="w-full bg-white hover:bg-gray-50 text-gray-500 font-medium text-xs py-2 px-4 rounded border border-gray-200 transition-colors disabled:opacity-50"
                        >
                            Limpiar Cola de Espera
                        </button>
                    </div>
                </div>

                {/* Resumen numérico del lote */}
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
                    <div className="flex justify-between">
                        <span className="text-gray-500">Errores:</span>
                        <span className="font-bold text-red-500 font-mono">
              {queue.filter((item) => item.status === "error").length}
            </span>
                    </div>
                </div>
            </aside>

            {/* PANEL DERECHO: COLA DE DIAGNÓSTICO CON SU PROPIO SHIMMER BAR */}
            <section className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <header className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                        Cola de Diagnóstico Secuencial
                    </h3>
                    {isProcessing && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold uppercase animate-pulse">
              Procesamiento Activo
            </span>
                    )}
                </header>

                {/* BARRA DE CARGA GLOBAL DEL LOTE (SHIMMER) */}
                {isProcessing && (
                    <div className="w-full bg-gray-100 h-1.5 overflow-hidden relative border-b border-gray-200">
                        <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-[#00AEEF] via-white to-[#00AEEF] animate-shimmer-bar opacity-80" />
                        <style>{`
              @keyframes shimmer-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
              .animate-shimmer-bar { animation: shimmer-bar 1.5s infinite linear; }
            `}</style>
                    </div>
                )}

                <div className="flex-1 p-4 max-h-[600px] overflow-y-auto divide-y divide-gray-100">
                    {queue.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <svg className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                            <p className="text-xs uppercase tracking-widest font-medium">No hay muestras en la cola de espera</p>
                        </div>
                    ) : (
                        queue.map((item) => (
                            <div key={item.id} className="py-3 flex justify-between items-center gap-4 group animate-fade-slide">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-tighter">
                                        Tamaño: {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
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

                                    {item.resultUrl && (
                                        <button
                                            onClick={() => window.open(item.resultUrl!, "_blank")}
                                            className="text-xs font-bold text-[#00AEEF] hover:underline"
                                        >
                                            Ver IHC
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}