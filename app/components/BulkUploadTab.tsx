'use client';

import { useState, DragEvent, ChangeEvent } from 'react';
import Image from 'next/image';
import { guardarDiagnostico } from '@/app/actions/auth';
import { sanitizarImagenCliente } from '@/lib/privacySanitizer';
import { QueueItem, QuantifyResponse } from '@/lib/types';

type ModalViewType = 'IHC Sintética' | 'Auditoría HSV' | 'Score-CAM';

/**
 * Pestaña para la carga y ejecucion masiva de lotes histopatologicos.
 * Encola muestras digitales, las despacha secuencialmente al backend y persiste los reportes.
 */
export default function BulkUploadTab() {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [activeModalItem, setActiveModalItem] = useState<QueueItem | null>(null);
    const [modalViewTab, setModalViewTab] = useState<ModalViewType>('IHC Sintética');
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [showCheck, setShowCheck] = useState<boolean>(false);

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const agregarArchivosACola = (files: FileList) => {
        const filesArray = Array.from(files);
        const extensionesPermitidas = ['.png', '.jpg', '.jpeg', '.tif', '.tiff'];

        const archivosValidos = filesArray.filter((f) => {
            const nombreMinuscula = f.name.toLowerCase();
            return extensionesPermitidas.some((ext) => nombreMinuscula.endsWith(ext));
        });

        if (archivosValidos.length < filesArray.length) {
            alert(
                'Se omitieron archivos con formato no admitido. Solo se admiten extensiones .png, .jpg, .jpeg, .tif o .tiff.'
            );
        }

        if (archivosValidos.length === 0) return;

        const newItems: QueueItem[] = archivosValidos.map((f, index) => ({
            id: Date.now() + index,
            name: f.name,
            file: f,
            status: 'espera',
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
            if (updatedQueue[i].status === 'completado' || updatedQueue[i].status === 'error') continue;

            updatedQueue[i].status = 'procesando';
            setQueue([...updatedQueue]);

            try {
                const sanitization = await sanitizarImagenCliente(updatedQueue[i].file);
                const formData = new FormData();
                formData.append('file', sanitization.sanitizedFile);

                const response = await fetch(`${BACKEND_URL}/api/quantify?mode=benchmark&use_watershed=true&use_tta=true`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Fallo en la inferencia del lote.');
                }

                const data: QuantifyResponse = await response.json();

                if (data.status === 'success') {
                    updatedQueue[i].status = 'completado';
                    updatedQueue[i].syntheticIhc = data.visual_payloads.synthetic_ihc_url;
                    updatedQueue[i].auditCanvas = data.visual_payloads.audit_canvas_url;
                    updatedQueue[i].scoreCam = data.visual_payloads.score_cam_url;
                    updatedQueue[i].positivityIndex = data.analytics.positivity_index_percentage;
                    updatedQueue[i].riskLevel = data.clinical_risk.level;
                    updatedQueue[i].riskColor = data.clinical_risk.color_code;

                    try {
                        await guardarDiagnostico({
                            request_id: data.metadata.request_id,
                            nombre_archivo: data.metadata.original_filename,
                            total_nuclei: data.analytics.total_nuclei_detected,
                            positive_nuclei: data.analytics.positive_nuclei_count,
                            positivity_index: data.analytics.positivity_index_percentage,
                            risk_level: data.clinical_risk.level,
                        });
                    } catch (dbErr: unknown) {
                        const message = dbErr instanceof Error ? dbErr.message : 'Error desconocido';
                        console.error('Fallo al guardar reporte de lote:', message);
                    }
                } else {
                    updatedQueue[i].status = 'error';
                    updatedQueue[i].errorDetail = 'Respuesta incompleta del servidor.';
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Error de conexión con el backend.';
                updatedQueue[i].status = 'error';
                updatedQueue[i].errorDetail = message;
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
            {/* Panel Izquierdo: Controles de Lote */}
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
                            isDragging
                                ? 'border-[#00AEEF] bg-blue-50 scale-[1.02]'
                                : queue.length > 0 && !showCheck
                                  ? 'border-[#00539C] bg-[#F4F9FD]'
                                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
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
                                    <circle
                                        className="stroke-green-500 fill-none"
                                        strokeWidth="4"
                                        cx="26"
                                        cy="26"
                                        r="24"
                                        style={{ animation: 'drawCircle 0.6s ease-out forwards' }}
                                    />
                                    <path
                                        className="stroke-green-500 fill-none"
                                        strokeWidth="4"
                                        d="M14.1 27.2l7.1 7.2 16.7-16.8"
                                        style={{ animation: 'drawCheck 0.4s ease-out 0.6s forwards' }}
                                    />
                                </svg>
                                <p className="text-sm font-bold text-green-600">Lote cargado</p>
                            </div>
                        ) : queue.length > 0 ? (
                            <div className="flex flex-col items-center justify-center">
                                <svg
                                    className="h-10 w-10 text-[#00539C] mb-3 opacity-80"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                    />
                                </svg>
                                <p className="text-sm text-[#00539C] font-bold">Lote listo en memoria</p>
                                <p className="text-xs text-gray-400 mt-2">Haga clic o arrastre para añadir más muestras</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center">
                                <svg
                                    className={`h-10 w-10 mb-4 transition-colors ${isDragging ? 'text-[#00AEEF]' : 'text-gray-400'}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                                <p className="text-sm text-gray-600 font-medium">
                                    {isDragging ? 'Suelte las imágenes aquí' : 'Arrastre las láminas o haga clic para explorar'}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">Formatos admitidos: PNG, JPG, JPEG, TIF, TIFF</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 mt-4">
                        <button
                            type="button"
                            onClick={procesarLote}
                            disabled={isProcessing || queue.length === 0}
                            className="w-full bg-[#00539C] hover:bg-[#004380] text-white font-bold text-sm py-3 px-4 rounded-lg transition-colors disabled:bg-gray-200 disabled:text-gray-400 uppercase tracking-wide shadow-sm cursor-pointer"
                        >
                            {isProcessing ? 'Procesando Lote en GPU...' : 'Iniciar Diagnóstico Masivo'}
                        </button>
                        <button
                            type="button"
                            onClick={limpiarCola}
                            disabled={isProcessing || queue.length === 0}
                            className="w-full bg-white hover:bg-gray-50 text-gray-500 font-medium text-xs py-2 px-4 rounded-lg border border-gray-200 transition-colors cursor-pointer"
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
                            {queue.filter((item) => item.status === 'completado').length}
                        </span>
                    </div>
                </div>
            </aside>

            {/* Panel Derecho: Cola de Procesamiento */}
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
                            <div
                                key={item.id}
                                className="py-3.5 flex justify-between items-center gap-4 group animate-fade-slide hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">{item.name}</p>
                                    {item.status === 'completado' && (
                                        <p
                                            className="text-[11px] font-bold mt-0.5"
                                            style={{ color: item.riskColor || '#000' }}
                                        >
                                            Índice Ki-67: {item.positivityIndex}% — {item.riskLevel}
                                        </p>
                                    )}
                                    {item.status === 'error' && (
                                        <p className="text-[11px] font-semibold mt-0.5 text-red-500">
                                            Muestra denegada: {item.errorDetail || 'Error de procesamiento'}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-4">
                                    <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                            item.status === 'completado'
                                                ? 'bg-green-50 text-green-700 border border-green-100'
                                                : item.status === 'procesando'
                                                  ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                                  : item.status === 'error'
                                                    ? 'bg-red-50 text-red-700 border border-red-100'
                                                    : 'bg-gray-50 text-gray-500 border border-gray-100'
                                        }`}
                                    >
                                        {item.status === 'espera' ? 'En cola' : item.status}
                                    </span>

                                    {item.status === 'completado' && item.syntheticIhc && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveModalItem(item);
                                                setModalViewTab('IHC Sintética');
                                            }}
                                            className="text-xs font-bold text-[#00539C] bg-blue-50 border border-blue-200/60 hover:bg-[#00539C] hover:text-white px-3 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer"
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

            {/* Modal de Detalle de Muestra */}
            {activeModalItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-slide">
                    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden border border-gray-100 flex flex-col">
                        <header className="bg-[#00539C] px-6 pt-3 flex justify-between items-end border-b-2 border-[#004380]">
                            <div className="flex items-end gap-1">
                                <button
                                    type="button"
                                    onClick={() => setModalViewTab('IHC Sintética')}
                                    className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors cursor-pointer ${
                                        modalViewTab === 'IHC Sintética'
                                            ? 'bg-white text-[#00539C]'
                                            : 'bg-[#004380] text-blue-200 hover:bg-[#003B70]'
                                    }`}
                                >
                                    Muestra Base
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalViewTab('Auditoría HSV')}
                                    className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors cursor-pointer ${
                                        modalViewTab === 'Auditoría HSV'
                                            ? 'bg-white text-[#00539C]'
                                            : 'bg-[#004380] text-blue-200 hover:bg-[#003B70]'
                                    }`}
                                >
                                    Auditoría de Contornos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModalViewTab('Score-CAM')}
                                    className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors cursor-pointer ${
                                        modalViewTab === 'Score-CAM'
                                            ? 'bg-white text-[#00539C]'
                                            : 'bg-[#004380] text-blue-200 hover:bg-[#003B70]'
                                    }`}
                                >
                                    Segmentación Multiclase
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveModalItem(null)}
                                className="text-white hover:text-blue-100 text-xs font-bold pb-2.5 tracking-wider uppercase transition-colors cursor-pointer"
                            >
                                Cerrar Visor ✕
                            </button>
                        </header>

                        <div className="bg-gray-100 p-6 flex flex-col md:flex-row gap-6 items-stretch justify-center max-h-[550px] overflow-y-auto">
                            <div className="flex-1 flex items-center justify-center bg-[#E2E8F0] rounded-xl border border-gray-200 p-2 min-h-[380px] relative overflow-hidden">
                                {activeModalItem && (
                                    <div className="w-full h-[380px] relative">
                                        <Image
                                            src={
                                                modalViewTab === 'IHC Sintética'
                                                    ? activeModalItem.syntheticIhc!
                                                    : modalViewTab === 'Auditoría HSV'
                                                      ? activeModalItem.auditCanvas!
                                                      : activeModalItem.scoreCam!
                                            }
                                            alt="Visualización de muestra en lote"
                                            fill
                                            unoptimized
                                            className="object-contain animate-fade-slide"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="w-full md:w-72 space-y-4 text-sm bg-white p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            Identificador de Muestra
                                        </span>
                                        <p className="font-semibold text-gray-700 truncate mt-0.5">
                                            {activeModalItem.name}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            Índice de Proliferación Ki-67
                                        </span>
                                        <p
                                            className="text-3xl font-black mt-0.5 font-mono"
                                            style={{ color: activeModalItem.riskColor || '#000' }}
                                        >
                                            {activeModalItem.positivityIndex}%
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            Estratificación Clínica
                                        </span>
                                        <div className="mt-1">
                                            <span
                                                className="font-bold uppercase text-[11px] px-2.5 py-1 rounded-md border border-gray-200 bg-slate-50"
                                                style={{ color: activeModalItem.riskColor || '#000' }}
                                            >
                                                {activeModalItem.riskLevel}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setActiveModalItem(null)}
                                    className="w-full bg-[#00539C] hover:bg-[#004380] text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-colors uppercase tracking-wide mt-4 shadow-sm cursor-pointer"
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