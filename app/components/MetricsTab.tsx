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

/**
 * Pestaña de validacion estadistica, benchmarking comparativo y matrices de contingencia diagnóstica.
 */
export default function MetricsTab() {
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

            <header className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-[#00539C] uppercase tracking-wide">
                    Validación Estadística y Benchmarking Computacional
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Evaluación comparativa cuantitativa y análisis de concordancia diagnóstica entre la arquitectura propuesta y el estado del arte.
                </p>
            </header>

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
    );
}