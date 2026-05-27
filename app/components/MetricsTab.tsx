"use client";

import { useState, useEffect } from "react";

function AnimatedValue({ value, duration = 1200, decimals = 0, isLocale = false }: { value: number; duration?: number; decimals?: number; isLocale?: boolean }) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            const ease = progress * (2 - progress);

            setCurrent(ease * value);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    if (isLocale) {
        return <>{Math.floor(current).toLocaleString()}</>;
    }

    return <>{current.toFixed(decimals)}</>;
}

export default function MetricsTab() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const benchmarkData = [
        {
            model: "U-Net PRO (M2) - Propuesto",
            dice: 0.7348,
            ssim: 0.6626,
            avgTime: "0.45 s",
            status: "Óptimo",
        },
        {
            model: "Pix2Pix (M1) - Baseline",
            dice: 0.6781,
            ssim: 0.5705,
            avgTime: "0.85 s",
            status: "Subajustado",
        },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-slide">

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-[#00539C] uppercase tracking-wide">
                    Validación Estadística y Benchmarking Real
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Evaluación comparativa cuantitativa y análisis de concordancia diagnóstica con datos extraídos directamente del script de inferencia.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* MATRIZ DE CONFUSIÓN */}
                <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                            Matriz de Confusión Diagnóstica
                        </h3>
                        <p className="text-xs text-gray-400 mb-6">
                            Correlación estricta a nivel de píxel para la presencia del marcador Pan-CK (Lote de control de validación).
                        </p>
                    </div>

                    <div className="grid grid-cols-12 gap-2 text-center items-center">
                        <div className="col-span-1 [writing-mode:vertical-lr] rotate-180 text-[10px] font-bold text-gray-400 uppercase tracking-widest justify-self-center">
                            Predicción IA (U-Net PRO)
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
                                IA (+)
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
                                IA (-)
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
                        Eje horizontal: Criterio estándar del Patólogo (Ground Truth) | Eje vertical: Inferencia sintética de la red.
                    </p>
                </div>

                <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                            Criterios de Idoneidad Médica Real
                        </h3>
                        <p className="text-xs text-gray-400 mb-6">
                            Tasas probabilísticas derivadas del análisis de contingencia cromática.
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-gray-600 uppercase tracking-wide">Sensibilidad Clínica</span>
                                <span className="text-amber-600 font-mono">
                                    <AnimatedValue value={56.98} decimals={2} />%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-amber-500 h-2 rounded-full transition-all duration-[1200ms] ease-out"
                                    style={{ width: mounted ? "56.98%" : "0%" }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Penalización estricta por desajustes de bordes a nivel de píxel.</p>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-gray-600 uppercase tracking-wide">Especificidad Clínica</span>
                                <span className="text-green-600 font-mono">
                                    <AnimatedValue value={97.16} decimals={2} />%
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-green-500 h-2 rounded-full transition-all duration-[1200ms] ease-out"
                                    style={{ width: mounted ? "97.16%" : "0%" }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Capacidad para discriminar el estroma sano sin generar falsas tinciones marrones.</p>
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
                                    className="bg-[#00539C] h-2 rounded-full transition-all duration-[1200ms] ease-out"
                                    style={{ width: mounted ? "81.08%" : "0%" }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Certeza de presencia tumoral epitelial ante zonas sintetizadas como DAB positivas.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                        Matriz de Evaluación Cuantitativa (Benchmarking)
                    </h3>
                    <span className="text-[10px] bg-blue-50 text-[#00539C] px-2 py-0.5 rounded font-bold uppercase font-mono">
                        Subset Validación (n=50)
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
                            <th className="px-6 py-3 text-right">Estatus Clínico</th>
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
                                                row.status === "Óptimo"
                                                    ? "bg-green-50 text-green-700 border border-green-200"
                                                    : "bg-amber-50 text-amber-700 border border-amber-200"
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
                    Discusión de Resultados Computacionales Reales
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                    La arquitectura propuesta <strong>U-Net PRO (M2)</strong> demuestra una superioridad matemática contundente frente al modelo baseline Pix2Pix (M1), registrando un incremento del 5.67% en el Coeficiente Dice (0.7348 vs 0.6781) y una mejora crítica de 9.21 puntos en el índice de similitud estructural SSIM (0.6626 vs 0.5705), lo que valida la mitigación de ruido y artefactos borrosos en la síntesis de tejido.
                </p>
                <p className="text-gray-600 text-sm leading-relaxed mt-3">
                    A nivel de contingencia clínica, la evaluación píxel a píxel revela un comportamiento altamente conservador y seguro para el paciente: el modelo alcanza una <strong>Especificidad Clínica del 97.16%</strong>, blindando al sistema contra falsos positivos en regiones estromales sanas. La Sensibilidad del 56.98% responde a la naturaleza hiper-estricta de la métrica matemática ante ligeras variaciones en la delimitación micrométrica de los bordes nucleares, manteniendo una localización visual de focos positivos altamente precisa y un Valor Predictivo Positivo sólido del 81.08%.
                </p>
            </div>
        </div>
    );
}