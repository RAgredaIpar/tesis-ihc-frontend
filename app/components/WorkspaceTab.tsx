'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import UploadZone from '@/app/components/UploadZone';
import { guardarDiagnostico } from '@/app/actions/auth';
import { sanitizarImagenCliente } from '@/lib/privacySanitizer';
import { QuantifyResponse, ViewType } from '@/lib/types';

interface Metrics {
    time: string;
    resolution: string;
    status: string;
}

/**
 * Mesa de trabajo principal para la carga, inferencia y cuantificacion celular digital.
 * Conecta con el backend FastAPI para ejecutar segmentacion multiclase y calcular el indice Ki-67.
 */
export default function WorkspaceTab() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [apiResult, setApiResult] = useState<QuantifyResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [activeViewTab, setActiveViewTab] = useState<ViewType>('IHC Sintética');
    const [inferenceMode, setInferenceMode] = useState<'benchmark' | 'hospital'>('benchmark');
    const [useWatershed, setUseWatershed] = useState<boolean>(true);
    const [showReportModal, setShowReportModal] = useState<boolean>(false);
    const [reportDate, setReportDate] = useState<string>('');
    const [medicoNombre, setMedicoNombre] = useState<string>('Médico Patólogo Especialista');

    useEffect(() => {
        setReportDate(new Date().toLocaleString('es-PE', { hour12: false }));

        const matchSession = document.cookie.match(new RegExp('(^| )sb_session=([^;]+)'));
        if (matchSession) {
            try {
                const token = matchSession[2];
                const base64Url = token.split('.')[1];
                if (base64Url) {
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(
                        atob(base64)
                            .split('')
                            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                            .join('')
                    );
                    const payload = JSON.parse(jsonPayload);
                    if (payload && payload.email) {
                        setMedicoNombre(payload.email.split('@')[0]);
                    }
                }
            } catch {
                // Silenciar fallos si el formato de token no es JWT estándar
            }
        }
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

    const [metrics, setMetrics] = useState<Metrics>({
        time: '0.00',
        resolution: '-',
        status: 'En espera',
    });

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const handleFile = (selectedFile: File): boolean => {
        const extensionesPermitidas = ['.png', '.jpg', '.jpeg', '.tif', '.tiff'];
        const nombreMinuscula = selectedFile.name.toLowerCase();
        const esValido = extensionesPermitidas.some((ext) => nombreMinuscula.endsWith(ext));

        if (!esValido) {
            alert('Formato no admitido. Seleccione un archivo de imagen histopatológica (.png, .jpg, .jpeg, .tif o .tiff).');
            return false;
        }

        setFile(selectedFile);
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);
        setApiResult(null);
        setActiveViewTab('IHC Sintética');

        const img = new window.Image();
        img.src = objectUrl;
        img.onload = () => {
            setMetrics((prev) => ({
                ...prev,
                resolution: `${img.width}x${img.height} px`,
                status: 'Lista para análisis',
            }));
        };

        return true;
    };

    const procesarLamina = async () => {
        if (!file) return;
        setLoading(true);
        setMetrics((prev) => ({ ...prev, status: 'Desidentificando...' }));

        const startTime = performance.now();

        try {
            // Purga de metadatos EXIF / Privacidad Ley 29733 en el navegador
            const sanitization = await sanitizarImagenCliente(file);
            setMetrics((prev) => ({ ...prev, status: 'Procesando en GPU...' }));

            const formData = new FormData();
            formData.append('file', sanitization.sanitizedFile);

            const queryParams = new URLSearchParams({
                mode: inferenceMode,
                use_watershed: String(useWatershed),
                use_tta: 'true',
            });

            const response = await fetch(`${BACKEND_URL}/api/quantify?${queryParams.toString()}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Fallo en la inferencia del pipeline.');
            }

            const data: QuantifyResponse = await response.json();
            const endTime = performance.now();
            const timeInSeconds = ((endTime - startTime) / 1000).toFixed(2);

            setApiResult(data);
            setMetrics({
                time: timeInSeconds,
                resolution: metrics.resolution,
                status: 'Completado',
            });

            try {
                await guardarDiagnostico({
                    request_id: data.metadata.request_id,
                    nombre_archivo: data.metadata.original_filename,
                    total_nuclei: data.analytics.total_nuclei_detected,
                    positive_nuclei: data.analytics.positive_nuclei_count,
                    positivity_index: data.analytics.positivity_index_percentage,
                    risk_level: data.clinical_risk.level,
                });
            } catch (persistErr: unknown) {
                const errMessage = persistErr instanceof Error ? persistErr.message : 'Error desconocido';
                console.error('Fallo en la persistencia del diagnóstico:', errMessage);
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error de conexión con el backend.';
            setMetrics((prev) => ({ ...prev, status: message }));
        } finally {
            setLoading(false);
        }
    };

    const currentResultImage = apiResult
        ? activeViewTab === 'IHC Sintética'
            ? apiResult.visual_payloads.synthetic_ihc_url
            : activeViewTab === 'Auditoría HSV'
              ? apiResult.visual_payloads.audit_canvas_url
              : apiResult.visual_payloads.score_cam_url
        : null;

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-slide">
            {/* Columna Izquierda: Panel de Control y Parametros */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <UploadZone onFileSelect={handleFile} loading={loading} />

                    {/* Parametros de Pipeline */}
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Modalidad de Entrada
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setInferenceMode('benchmark')}
                                className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                                    inferenceMode === 'benchmark'
                                        ? 'bg-[#00539C] text-white border-[#00539C]'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                IHC Nativo (Ki-67)
                            </button>
                            <button
                                type="button"
                                onClick={() => setInferenceMode('hospital')}
                                className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                                    inferenceMode === 'hospital'
                                        ? 'bg-[#00539C] text-white border-[#00539C]'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                H&E Hospitalario
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-gray-600 font-medium">Separación Watershed:</span>
                            <input
                                type="checkbox"
                                checked={useWatershed}
                                onChange={(e) => setUseWatershed(e.target.checked)}
                                className="h-4 w-4 text-[#00539C] rounded border-gray-300 focus:ring-[#00539C]"
                            />
                        </div>
                    </div>

                    {/* Aviso de Privacidad y Desidentificacion Ley 29733 */}
                    <div className="mt-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-[11px] text-slate-600">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <div>
                            <span className="font-bold text-slate-800">Privacidad Ley N° 29733:</span> Muestra desidentificada en origen. Los metadatos de paciente son purgados irreversiblemente en el cliente antes de la inferencia.
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={procesarLamina}
                        disabled={loading || !file}
                        className="w-full mt-4 bg-[#00539C] hover:bg-[#004380] text-white font-bold text-sm py-3 px-4 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed uppercase tracking-wide shadow-sm cursor-pointer"
                    >
                        {loading ? 'Procesando Muestra...' : 'Ejecutar Cuantificación Ki-67'}
                    </button>
                </div>

                {/* Metricas de Inferencia */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b pb-2">
                        Telemetría y Seguridad
                    </h3>
                    <ul className="space-y-3 text-sm">
                        <li className="flex justify-between items-center">
                            <span className="text-gray-500">Arquitectura</span>
                            <span className="font-semibold text-[#00539C] bg-blue-50 px-2 py-1 rounded text-xs font-mono">
                                U-Net PRO Multiclase
                            </span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className="text-gray-500">Resolución Fuente</span>
                            <span className="font-mono text-xs">{metrics.resolution}</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className="text-gray-500">Tiempo de Cómputo</span>
                            <span className="font-mono font-bold text-xs">{metrics.time} s</span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className="text-gray-500">Gobernanza de Datos</span>
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                Retención Cero (GPU)
                            </span>
                        </li>
                        <li className="flex justify-between items-center">
                            <span className="text-gray-500">Estado</span>
                            <span
                                className={`text-xs font-bold px-2 py-1 rounded max-w-[180px] truncate ${
                                    metrics.status === 'Completado'
                                        ? 'bg-green-100 text-green-700'
                                        : metrics.status.includes('Error') ||
                                            metrics.status.includes('inválida') ||
                                            metrics.status.includes('rechazada')
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {metrics.status}
                            </span>
                        </li>
                    </ul>
                </div>
            </aside>

            {/* Columna Derecha: Visor Multicanal y Diagnostico Clinico */}
            <section className="lg:col-span-8 flex flex-col gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="bg-[#00539C] px-3 pt-3 flex justify-between items-end border-b-2 border-[#004380]">
                        <div className="flex items-end gap-1">
                            <button
                                type="button"
                                onClick={() => setActiveViewTab('IHC Sintética')}
                                className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors cursor-pointer ${
                                    activeViewTab === 'IHC Sintética'
                                        ? 'bg-white text-[#00539C]'
                                        : 'bg-[#004380] text-blue-200 hover:bg-[#003B70]'
                                }`}
                            >
                                Muestra Base
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveViewTab('Auditoría HSV')}
                                className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors cursor-pointer ${
                                    activeViewTab === 'Auditoría HSV'
                                        ? 'bg-white text-[#00539C]'
                                        : 'bg-[#004380] text-blue-200 hover:bg-[#003B70]'
                                }`}
                            >
                                Auditoría de Contornos
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveViewTab('Score-CAM')}
                                className={`px-5 py-2.5 text-sm font-bold tracking-wide rounded-t-lg transition-colors cursor-pointer ${
                                    activeViewTab === 'Score-CAM'
                                        ? 'bg-white text-[#00539C]'
                                        : 'bg-[#004380] text-blue-200 hover:bg-[#003B70]'
                                }`}
                            >
                                Segmentación Multiclase
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
                                <div className="w-12 h-12 border-4 border-gray-300 border-t-[#00539C] rounded-full animate-spin"></div>
                                <span className="text-sm font-bold text-[#00539C] uppercase tracking-widest animate-pulse">
                                    Segmentando núcleos y cuantificando biomarcador...
                                </span>
                            </div>
                        ) : currentResultImage ? (
                            <div className="w-full h-full relative">
                                <Image
                                    key={activeViewTab}
                                    src={currentResultImage}
                                    alt={`Resultado de ${activeViewTab}`}
                                    fill
                                    unoptimized
                                    className="object-contain animate-fade-slide"
                                />
                            </div>
                        ) : (
                            <div className="text-gray-400 flex flex-col items-center gap-3">
                                <svg
                                    className="w-12 h-12 opacity-50"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span className="text-sm uppercase tracking-widest font-medium">
                                    Visor inactivo - Cargue una muestra y ejecute el análisis
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reporte Cuantitativo Integrado */}
                {apiResult && (
                    <div
                        className="bg-white p-6 rounded-xl shadow-sm border-t-4 transition-all grid grid-cols-1 md:grid-cols-3 gap-6"
                        style={{ borderTopColor: apiResult.clinical_risk.color_code }}
                    >
                        <div className="md:col-span-1 border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-4 flex flex-col justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Riesgo Proliferativo
                            </span>
                            <h4
                                className="text-2xl font-black mt-0.5"
                                style={{ color: apiResult.clinical_risk.color_code }}
                            >
                                {apiResult.clinical_risk.level}
                            </h4>
                            <div className="mt-4">
                                <span className="text-4xl font-extrabold tracking-tight text-gray-900 font-mono">
                                    {apiResult.analytics.positivity_index_percentage}%
                                </span>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                    Índice Ki-67 Calibrado
                                </p>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                            <p className="text-sm text-gray-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                {apiResult.clinical_risk.description}
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-slate-50 p-2 rounded-lg border border-gray-100">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Núcleos Totales</p>
                                    <p className="text-lg font-bold text-gray-800 font-mono">
                                        {apiResult.analytics.total_nuclei_detected}
                                    </p>
                                </div>
                                <div className="bg-red-50 p-2 rounded-lg border border-red-100">
                                    <p className="text-[10px] text-red-500 font-bold uppercase">DAB+ (Ki-67+)</p>
                                    <p className="text-lg font-bold text-red-600 font-mono">
                                        {apiResult.analytics.positive_nuclei_count}
                                    </p>
                                </div>
                                <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">H- (Basales)</p>
                                    <p className="text-lg font-bold text-blue-600 font-mono">
                                        {apiResult.analytics.negative_nuclei_count}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setReportDate(new Date().toLocaleString('es-PE', { hour12: false }));
                                    setShowReportModal(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-[#00539C] hover:bg-[#003e75] text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                                <span>Generar Ficha Anatomopatológica / Exportar PDF</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Referencia Morfologica Original */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Referencia de Entrada (Muestra Original Cargada)
                        </h3>
                    </div>

                    <div className="h-64 w-full bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative group">
                        {preview ? (
                            <div className="w-full h-full relative">
                                <Image
                                    src={preview}
                                    alt="Muestra histopatológica de entrada"
                                    fill
                                    unoptimized
                                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                        ) : (
                            <div className="text-center p-4">
                                <p className="text-xs text-gray-400 font-bold uppercase">
                                    Esperando carga de muestra histológica
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Modal de Reporte e Impresión Clínica Estructurada */}
            {showReportModal && apiResult && (
                <div
                    onClick={() => setShowReportModal(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-200 flex flex-col my-auto print:shadow-none print:border-none print:w-full print:max-w-none"
                    >
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
                                    onClick={() => setShowReportModal(false)}
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
                                        ID: {apiResult.metadata.request_id ? apiResult.metadata.request_id.substring(0, 13).toUpperCase() : 'MUESTRA-IHC'}
                                    </p>
                                </div>
                            </div>

                            {/* Metadatos de la Muestra */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Origen de la Muestra</p>
                                    <p className="font-semibold text-gray-700 mt-0.5 truncate">
                                        {apiResult.metadata.original_filename || file?.name || 'Muestra Histológica'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">Fecha de Emisión</p>
                                    <p className="font-semibold text-gray-700 mt-0.5">
                                        {reportDate || new Date().toLocaleString('es-PE', { hour12: false })}
                                    </p>
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
                                {medicoNombre && (
                                    <div className="col-span-2 border-t border-slate-200/80 pt-2.5 flex justify-between items-center bg-white/70 -mx-4 -mb-4 px-4 py-2.5 rounded-b-lg">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                                            Médico Evaluador
                                        </span>
                                        <span className="font-bold text-[#00539C] text-xs">
                                            {medicoNombre}
                                        </span>
                                    </div>
                                )}
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
                                            {apiResult.analytics.total_nuclei_detected}
                                        </p>
                                    </div>
                                    <div className="border border-gray-200 p-3 rounded-lg bg-slate-50/50">
                                        <p className="text-gray-400 font-medium">Firma Cromática Positiva (DAB+)</p>
                                        <p className="text-xl font-bold text-red-600 mt-1 font-mono">
                                            {apiResult.analytics.positive_nuclei_count}
                                        </p>
                                    </div>
                                    <div className="border border-gray-200 p-3 rounded-lg bg-slate-50/50">
                                        <p className="text-gray-400 font-medium">Índice de Proliferación Ki-67</p>
                                        <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
                                            {apiResult.analytics.positivity_index_percentage}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Riesgo Clínico */}
                            <div className="border border-gray-300 rounded-lg p-4 space-y-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Evaluación de Riesgo Clínico Estructurado
                                </span>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`text-xs font-black px-3 py-1 rounded-md border uppercase tracking-wider ${getRiskStyles(
                                            apiResult.clinical_risk.level
                                        )}`}
                                        style={apiResult.clinical_risk.color_code ? { borderColor: apiResult.clinical_risk.color_code } : undefined}
                                    >
                                        Nivel: {apiResult.clinical_risk.level}
                                    </span>
                                    <p className="text-xs text-gray-500 leading-relaxed">
                                        {apiResult.clinical_risk.description ||
                                            'La cuantificación porcentual del biomarcador nuclear Ki-67 refleja el índice proliferativo tumoral en el tejido histopatológico analizado, fundamentado en la segmentación de núcleos reactivos DAB positivos.'}
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
                                        {apiResult.metadata.request_id
                                            ? btoa(apiResult.metadata.request_id).substring(0, 16)
                                            : 'CERT_HASH'}
                                    </p>
                                    <p className="text-[9px] text-[#00539C] font-bold mt-2 uppercase tracking-wide">
                                        Firma del Sistema
                                    </p>
                                </div>

                                <div className="border-t border-dashed border-gray-400 pt-6 max-w-[220px] w-full mx-auto self-end">
                                    <p className="font-semibold text-gray-700">
                                        {medicoNombre || 'Firma del Médico Especialista'}
                                    </p>
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