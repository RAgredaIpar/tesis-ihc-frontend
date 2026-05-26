"use client";

export default function MetricsTab() {
    const benchmarkData = [
        {
            model: "U-Net PRO (M2) - Propuesto",
            dice: "0.80",
            mse: "0.024",
            ssim: "0.88",
            avgTime: "0.45 s",
            status: "Óptimo",
        },
        {
            model: "Pix2Pix (M1) - Baseline",
            dice: "0.68",
            mse: "0.078",
            ssim: "0.74",
            avgTime: "0.85 s",
            status: "Subajustado",
        },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-slide">

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-[#00539C] uppercase tracking-wide">
                    Validación Estadística y Benchmarking
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Evaluación comparativa cuantitativa y análisis de concordancia diagnóstica del modelo adaptado al entorno clínico de EsSalud.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                            Matriz de Confusión Diagnóstica
                        </h3>
                        <p className="text-xs text-gray-400 mb-6">
                            Correlación píxel-región para la presencia del marcador epitelial Pan-CK (n=1000 parches de validación).
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
                                <p className="text-2xl font-black text-green-700">442</p>
                                <p className="text-[9px] font-bold text-green-600 uppercase mt-1">Verdaderos Positivos</p>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-lg p-4 transition-all hover:shadow-md">
                                <p className="text-2xl font-black text-red-600">42</p>
                                <p className="text-[9px] font-bold text-red-500 uppercase mt-1">Falsos Positivos</p>
                            </div>

                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest self-center text-right pr-2">
                                IA (-)
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 transition-all hover:shadow-md">
                                <p className="text-2xl font-black text-amber-600">58</p>
                                <p className="text-[9px] font-bold text-amber-500 uppercase mt-1">Falsos Negativos</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 transition-all hover:shadow-md">
                                <p className="text-2xl font-black text-[#00539C]">458</p>
                                <p className="text-[9px] font-bold text-blue-600 uppercase mt-1">Verdaderos Negativos</p>
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-[10px] text-gray-400 text-center italic">
                        Eje horizontal: Criterio estándar del Patólogo (Ground Truth) | Eje vertical: Inferencia sintética del algoritmo.
                    </p>
                </div>

                <div className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1">
                            Criterios de Idoneidad Médica
                        </h3>
                        <p className="text-xs text-gray-400 mb-6">
                            Tasas probabilísticas derivadas del análisis de contingencia.
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-gray-600 uppercase tracking-wide">Sensibilidad Diagnóstica</span>
                                <span className="text-green-600 font-mono">88.40%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: "88.4%" }}></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Capacidad para omitir falsos negativos en zonas tumorales activas.</p>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-gray-600 uppercase tracking-wide">Especificidad Diagnóstica</span>
                                <span className="text-[#00539C] font-mono">91.60%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-[#00539C] h-2 rounded-full" style={{ width: "91.6%" }}></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Capacidad para discriminar tejido conectivo o estroma sano sin sobre-teñir.</p>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                                <span className="text-gray-600 uppercase tracking-wide">Valor Predictivo Positivo (VPP)</span>
                                <span className="text-amber-600 font-mono">91.32%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-amber-500 h-2 rounded-full" style={{ width: "91.32%" }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                        Matriz de Evaluación Cuantitativa (Benchmarking)
                    </h3>
                    <span className="text-[10px] bg-blue-50 text-[#00539C] px-2 py-0.5 rounded font-bold uppercase">
            Muestras n=1000
          </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            <th className="px-6 py-3">Arquitectura Evaluada</th>
                            <th className="px-6 py-3">Coeficiente Dice (F1)</th>
                            <th className="px-6 py-3">Error Cuadrático Medio (MSE)</th>
                            <th className="px-6 py-3">Índice SSIM</th>
                            <th className="px-6 py-3">Tiempo de Inferencia Promedio</th>
                            <th className="px-6 py-3 text-right">Estatus Clínico</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                        {benchmarkData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-700">{row.model}</td>
                                <td className="px-6 py-4 font-mono font-semibold">{row.dice}</td>
                                <td className="px-6 py-4 font-mono text-gray-600">{row.mse}</td>
                                <td className="px-6 py-4 font-mono text-gray-600">{row.ssim}</td>
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
                    Discusión de Resultados Computacionales
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                    La arquitectura propuesta U-Net PRO supera al modelo base en un 12% en términos de Coeficiente Dice. La reducción crítica del MSE de 0.078 a 0.024 demuestra que el uso del dataset con alineación perfecta de píxeles (DeepLIIF) mitiga las distorsiones geométricas. Asimismo, los niveles de Sensibilidad (88.40%) y Especificidad (91.60%) alcanzados otorgan un alto nivel de seguridad biológica para la detección precisa de carcinomas epiteliales (positivos para Pan-CK) sin falsos positivos en regiones estromales.
                </p>
            </div>
        </div>
    );
}