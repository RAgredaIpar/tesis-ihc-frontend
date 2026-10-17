'use client';

import { useState, useEffect } from 'react';

interface AnimatedValueProps {
    value: number;
    duration?: number;
    decimals?: number;
    isLocale?: boolean;
}

function AnimatedValue({ value, duration = 1200, decimals = 0, isLocale = false }: AnimatedValueProps) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const ease = progress * (2 - progress);

            setCurrent(ease * value);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [value, duration]);

    if (isLocale) {
        return <>{Math.floor(current).toLocaleString('es-PE')}</>;
    }

    return <>{current.toFixed(decimals)}</>;
}

import { CLINICAL_VALIDATION_50_PATCHES } from '@/lib/clinicalValidationData';

/**
 * Pestaña de validacion estadistica, benchmarking comparativo y matrices de contingencia diagnóstica.
 */
export default function MetricsTab() {
    const [viewMode, setViewMode] = useState<'clinical' | 'computational'>('clinical');
    const [clinicalFilter, setClinicalFilter] = useState<'all' | 'match' | 'discrepant'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const benchmarkData = [
        {
            model: 'U-Net PRO (M2) - Propuesto',
            dice: 0.7348,
            ssim: 0.6626,
            avgTime: '0.45 s',
            status: 'Óptimo',
        },
        {
            model: 'Pix2Pix (M1) - Baseline',
            dice: 0.6781,
            ssim: 0.5705,
            avgTime: '0.85 s',
            status: 'Subajustado',
        },
    ];

    const filteredPatches = CLINICAL_VALIDATION_50_PATCHES.filter((item) => {
        const matchesFilter =
            clinicalFilter === 'all'
                ? true
                : clinicalFilter === 'match'
                  ? item.clinicalMatch
                  : !item.clinicalMatch;

        const matchesSearch =
            searchQuery.trim() === '' ||
            item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(item.id).includes(searchQuery);

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-slide">
            <style>{`
                @keyframes barGrow {
                    from { width: 0%; }
                }
                .animate-bar-grow {
                    animation: barGrow 1.2s ease-out forwards;
                }
            `}</style>

            <header className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[#00539C] uppercase tracking-wide">
                        Validación Clínica y Benchmarking Estadístico
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Estudio de concordancia diagnóstica a doble ciego con médicos especialistas y métricas comparativas de modelos.
                    </p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 self-start md:self-auto">
                    <button
                        type="button"
                        onClick={() => setViewMode('clinical')}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                            viewMode === 'clinical'
                                ? 'bg-white text-[#00539C] shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Validación Patólogas (n=50)
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('computational')}
                        className={`px-4 py-2 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                            viewMode === 'computational'
                                ? 'bg-white text-[#00539C] shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Telemetría Computacional
                    </button>
                </div>
            </header>

            {viewMode === 'clinical' ? (
                <div className="space-y-6">
                    {/* Tarjetas KPI de Concordancia Clinica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                                Concordancia Diagnóstica IA vs Consenso
                            </span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-black text-[#00539C] font-mono">
                                    <AnimatedValue value={86.0} decimals={1} />%
                                </span>
                                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                    43 / 50 Parches
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2">
                                Coincidencia clínica binaria según umbral de St. Gallen (15%).
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                                Concordancia Inter-Patólogas
                            </span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-black text-indigo-700 font-mono">
                                    <AnimatedValue value={88.0} decimals={1} />%
                                </span>
                                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                    44 / 50 Parches
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2">
                                Acuerdo entre Dra. Zaida (P1) y Dra. Patricia (P2).
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-green-200 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                                Sensibilidad Clínica (Alta Proliferación)
                            </span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-black text-green-700 font-mono">
                                    <AnimatedValue value={88.0} decimals={1} />%
                                </span>
                                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                                    22 / 25 Casos
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2">
                                Detección correcta de muestras con proliferación Ki-67 ≥ 15%.
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">
                                Especificidad Clínica (Baja Proliferación)
                            </span>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-3xl font-black text-emerald-700 font-mono">
                                    <AnimatedValue value={84.0} decimals={1} />%
                                </span>
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                    21 / 25 Casos
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-2">
                                Confirmación certera de muestras con proliferación Ki-67 &lt; 15%.
                            </p>
                        </div>
                    </div>

                    {/* Matriz 2x2 de Contingencia Clinica y Resumen del Estudio */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                                    Matriz de Concordancia Diagnóstica (Categorías Clínicas)
                                </h3>
                                <p className="text-xs text-gray-400 mb-6">
                                    Correlación categórica binaria entre el Consenso Humano Gold Standard y el Dictamen de U-Net PRO.
                                </p>
                            </div>

                            <div className="grid grid-cols-12 gap-2 text-center items-center">
                                <div className="col-span-1 [writing-mode:vertical-lr] rotate-180 text-[10px] font-bold text-gray-400 uppercase tracking-widest justify-self-center">
                                    Dictamen U-Net PRO
                                </div>

                                <div className="col-span-11 grid grid-cols-3 gap-2">
                                    <div></div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-1">
                                        Consenso Alta (≥15%)
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-1">
                                        Consenso Baja (&lt;15%)
                                    </div>

                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest self-center text-right pr-2">
                                        IA Alta (≥15%)
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-2xl font-black text-green-700 font-mono">22</p>
                                        <p className="text-[9px] font-bold text-green-600 uppercase mt-1">Verdaderos Positivos</p>
                                    </div>
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                                        <p className="text-2xl font-black text-red-600 font-mono">4</p>
                                        <p className="text-[9px] font-bold text-red-500 uppercase mt-1">Falsos Positivos</p>
                                    </div>

                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest self-center text-right pr-2">
                                        IA Baja (&lt;15%)
                                    </div>
                                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                                        <p className="text-2xl font-black text-amber-600 font-mono">3</p>
                                        <p className="text-[9px] font-bold text-amber-500 uppercase mt-1">Falsos Negativos</p>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-2xl font-black text-[#00539C] font-mono">21</p>
                                        <p className="text-[9px] font-bold text-blue-600 uppercase mt-1">Verdaderos Negativos</p>
                                    </div>
                                </div>
                            </div>

                            <p className="mt-4 text-[10px] text-gray-400 text-center italic">
                                Coincidencia en 43 de 50 parches (86.0%). Las 7 discrepancias ocurrieron en zonas limítrofes al corte del 15%.
                            </p>
                        </div>

                        <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                                    Ficha Técnica del Estudio en Doble Ciego
                                </h3>
                                <p className="text-xs text-gray-400 mb-4">
                                    Parámetros del protocolo de validación clínica conducido en el Hospital Virgen de la Puerta / EsSalud.
                                </p>
                            </div>

                            <ul className="space-y-3 text-xs divide-y divide-gray-100">
                                <li className="flex justify-between items-center pt-2">
                                    <span className="text-gray-500 font-medium">Médico Evaluador 1</span>
                                    <span className="font-semibold text-gray-800">Dra. Zaida (Patóloga Principal)</span>
                                </li>
                                <li className="flex justify-between items-center pt-2">
                                    <span className="text-gray-500 font-medium">Médico Evaluador 2</span>
                                    <span className="font-semibold text-gray-800">Dra. Patricia (Patóloga Re-evaluadora)</span>
                                </li>
                                <li className="flex justify-between items-center pt-2">
                                    <span className="text-gray-500 font-medium">Muestreo Histopatológico</span>
                                    <span className="font-mono font-semibold text-[#00539C]">n = 50 parches digitales (40x, 512×512 px)</span>
                                </li>
                                <li className="flex justify-between items-center pt-2">
                                    <span className="text-gray-500 font-medium">Promedio Estimado Patóloga 1</span>
                                    <span className="font-mono font-bold text-gray-700">22.53 %</span>
                                </li>
                                <li className="flex justify-between items-center pt-2">
                                    <span className="text-gray-500 font-medium">Promedio Estimado Patóloga 2</span>
                                    <span className="font-mono font-bold text-gray-700">23.50 %</span>
                                </li>
                                <li className="flex justify-between items-center pt-2">
                                    <span className="text-gray-500 font-medium">Promedio Cuantificado por IA</span>
                                    <span className="font-mono font-bold text-[#00539C]">16.75 %</span>
                                </li>
                                <li className="flex justify-between items-center pt-2">
                                    <span className="text-gray-500 font-medium">Diferencia Absoluta Media</span>
                                    <span className="font-mono font-bold text-amber-600">10.54 %</span>
                                </li>
                            </ul>

                            <div className="mt-4 p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-[11px] text-gray-600 leading-relaxed">
                                <strong>Hallazgo Clínico:</strong> La estimación visual manual de los patólogos tiende a sobrestimar la positividad cromógena en zonas con alta densidad nuclear. La cuantificación computacional basada en segmentación celular individual reduce el sesgo cognitivo subjetivo, proporcionando conteos celulares discretos fidedignos.
                            </div>
                        </div>
                    </div>

                    {/* Tabla de los 50 Parches Clinicos Evaluados */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                                    Auditoría Detallada de Parches Clínicos (n = 50)
                                </h3>
                                <p className="text-[11px] text-gray-400 mt-0.5">
                                    Contraste parche a parche: Dra. Zaida vs. Dra. Patricia vs. Consenso vs. IA.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex bg-white rounded-lg border border-gray-200 p-0.5 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setClinicalFilter('all')}
                                        className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                                            clinicalFilter === 'all'
                                                ? 'bg-[#00539C] text-white'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Todos (50)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setClinicalFilter('match')}
                                        className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                                            clinicalFilter === 'match'
                                                ? 'bg-green-600 text-white'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Coincidentes (43)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setClinicalFilter('discrepant')}
                                        className={`px-3 py-1 rounded font-semibold cursor-pointer ${
                                            clinicalFilter === 'discrepant'
                                                ? 'bg-amber-600 text-white'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        Discrepancias (7)
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Buscar parche..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="px-3 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#00539C]"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-[460px]">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider shadow-xs">
                                    <tr>
                                        <th className="px-4 py-3">N°</th>
                                        <th className="px-4 py-3">Archivo 40x</th>
                                        <th className="px-4 py-3 text-center">Dra. Zaida (P1)</th>
                                        <th className="px-4 py-3 text-center">Dra. Patricia (P2)</th>
                                        <th className="px-4 py-3 text-center">Consenso Humano</th>
                                        <th className="px-4 py-3 text-center text-[#00539C]">U-Net PRO (IA)</th>
                                        <th className="px-4 py-3 text-center">Núcleos (Ki-67+ / Tot)</th>
                                        <th className="px-4 py-3 text-center">Dif. Absoluta</th>
                                        <th className="px-4 py-3 text-right">Coincidencia</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredPatches.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-4 py-2.5 font-mono text-gray-400">#{p.id}</td>
                                            <td className="px-4 py-2.5 font-semibold text-gray-800 font-mono">{p.fileName}</td>
                                            <td className="px-4 py-2.5 text-center font-mono text-gray-700">{p.p1Percent}%</td>
                                            <td className="px-4 py-2.5 text-center font-mono text-gray-700">{p.p2Percent}%</td>
                                            <td className="px-4 py-2.5 text-center font-mono font-bold text-gray-900 bg-gray-50/50">
                                                {p.humanConsensusPercent}%
                                            </td>
                                            <td className="px-4 py-2.5 text-center font-mono font-bold text-[#00539C] bg-blue-50/30">
                                                {p.iaPercent}%
                                            </td>
                                            <td className="px-4 py-2.5 text-center font-mono text-gray-600">
                                                {p.positiveNuclei} / {p.totalNuclei}
                                            </td>
                                            <td className="px-4 py-2.5 text-center font-mono text-gray-500">
                                                {p.absoluteDiff}%
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                <span
                                                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                        p.clinicalMatch
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                    }`}
                                                >
                                                    {p.clinicalMatch ? 'Coincidente' : 'Fronteriza'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Matriz de Confusion */}
                <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                            Matriz de Confusión Diagnóstica
                        </h3>
                        <p className="text-xs text-gray-400 mb-6">
                            Correlación estricta a nivel de píxel para la presencia del biomarcador Ki-67 en el conjunto de prueba clínico.
                        </p>
                    </div>

                    <div className="grid grid-cols-12 gap-2 text-center items-center">
                        <div className="col-span-1 [writing-mode:vertical-lr] rotate-180 text-[10px] font-bold text-gray-400 uppercase tracking-widest justify-self-center">
                            Predicción (U-Net PRO)
                        </div>

                        <div className="col-span-11 grid grid-cols-3 gap-2">
                            <div></div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-1">
                                IHC Real (+)
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-1">
                                IHC Real (-)
                            </div>

                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest self-center text-right pr-2">
                                Modelo (+)
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 transition-all hover:shadow-md">
                                <p className="text-xl font-black text-green-700 font-mono">
                                    <AnimatedValue value={334764} isLocale />
                                </p>
                                <p className="text-[9px] font-bold text-green-600 uppercase mt-1">Verdaderos Positivos</p>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-lg p-4 transition-all hover:shadow-md">
                                <p className="text-xl font-black text-red-600 font-mono">
                                    <AnimatedValue value={78135} isLocale />
                                </p>
                                <p className="text-[9px] font-bold text-red-500 uppercase mt-1">Falsos Positivos</p>
                            </div>

                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest self-center text-right pr-2">
                                Modelo (-)
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 transition-all hover:shadow-md">
                                <p className="text-xl font-black text-amber-600 font-mono">
                                    <AnimatedValue value={252701} isLocale />
                                </p>
                                <p className="text-[9px] font-bold text-amber-500 uppercase mt-1">Falsos Negativos</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 transition-all hover:shadow-md">
                                <p className="text-xl font-black text-[#00539C] font-mono">
                                    <AnimatedValue value={2676736} isLocale />
                                </p>
                                <p className="text-[9px] font-bold text-blue-600 uppercase mt-1">Verdaderos Negativos</p>
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-[10px] text-gray-400 text-center italic">
                        Eje horizontal: Criterio Ground Truth del Patólogo | Eje vertical: Segmentación inferida por el modelo.
                    </p>
                </div>

                {/* Criterios Diagnosticos */}
                <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                            Criterios de Idoneidad Diagnóstica
                        </h3>
                        <p className="text-xs text-gray-400 mb-6">
                            Tasas probabilísticas derivadas del análisis cuantitativo de contingencia cromática.
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-gray-600 uppercase tracking-wide">Sensibilidad Diagnóstica</span>
                                <span className="text-amber-600 font-mono">
                                    <AnimatedValue value={56.98} decimals={2} />%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-amber-500 h-2 rounded-full animate-bar-grow"
                                    style={{ width: '56.98%' }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                                Medición restrictiva que penaliza variaciones micrométricas en el borde nuclear celular.
                            </p>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-gray-600 uppercase tracking-wide">Especificidad Diagnóstica</span>
                                <span className="text-green-600 font-mono">
                                    <AnimatedValue value={97.16} decimals={2} />%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-green-500 h-2 rounded-full animate-bar-grow"
                                    style={{ width: '97.16%' }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                                Capacidad para discriminar tejido basal y estroma sin generar falsas detecciones nucleares.
                            </p>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-gray-600 uppercase tracking-wide">Valor Predictivo Positivo (VPP)</span>
                                <span className="text-[#00539C] font-mono">
                                    <AnimatedValue value={81.08} decimals={2} />%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-[#00539C] h-2 rounded-full animate-bar-grow"
                                    style={{ width: '81.08%' }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                                Confiabilidad ante núcleos segmentados como DAB positivos (Ki-67+).
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de Benchmarking */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                        Matriz de Evaluación Comparativa (Benchmarking)
                    </h3>
                    <span className="text-[10px] bg-blue-50 text-[#00539C] px-2 py-0.5 rounded font-bold uppercase font-mono">
                        Conjunto de Prueba (n=50)
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-3">Arquitectura Evaluada</th>
                                <th className="px-6 py-3">Coeficiente Dice (F1)</th>
                                <th className="px-6 py-3">Índice SSIM (Estructural)</th>
                                <th className="px-6 py-3">Tiempo de Inferencia Promedio</th>
                                <th className="px-6 py-3 text-right">Estatus Diagnóstico</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {benchmarkData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-700">{row.model}</td>
                                    <td className="px-6 py-4 font-mono font-semibold text-gray-800">
                                        <AnimatedValue value={row.dice} decimals={4} />
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-600">
                                        <AnimatedValue value={row.ssim} decimals={4} />
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-600">{row.avgTime}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span
                                            className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                                                row.status === 'Óptimo'
                                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}
                                        >
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                    Discusión de Resultados Computacionales
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                    La arquitectura propuesta <strong>U-Net PRO (M2)</strong> demuestra una superioridad cuantitativa
                    frente al modelo baseline Pix2Pix (M1), alcanzando un incremento en el Coeficiente Dice (0.7348 vs
                    0.6781) y una mejora significativa en el índice de similitud estructural SSIM (0.6626 vs 0.5705), lo
                    cual reduce los artefactos de desenfoque en la síntesis de contraste.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mt-3">
                    En el ámbito de la evaluación clínica por píxel, el modelo exhibe un comportamiento altamente
                    específico: alcanza una <strong>Especificidad Diagnóstica del 97.16%</strong>, previniendo falsos
                    positivos en tejido estromal basal. La Sensibilidad del 56.98% responde a la naturaleza estricta del
                    criterio de coincidencia espacial a nivel de píxel ante ligeras desviaciones de borde, manteniendo un
                    Valor Predictivo Positivo consistente de 81.08% en la identificación del biomarcador Ki-67.
                </p>
            </div>
        </div>
    )}
</div>
);
}