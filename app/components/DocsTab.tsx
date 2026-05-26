"use client";

export default function DocsTab() {
    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-slide">

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-[#00539C] uppercase tracking-wide">
                    Documentación Técnica y Manual de Operación
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Sustento científico, guía de usuario y glosario normativo para el uso del software de tinción virtual en el Servicio de Anatomía Patológica.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div className="lg:col-span-7 space-y-6">

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#00539C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Protocolo de Operación Estándar
                        </h3>

                        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                            <div className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#00539C] font-bold text-xs flex items-center justify-center">1</span>
                                <div>
                                    <p className="font-bold text-gray-700">Preparación de la Muestra Digital:</p>
                                    <p className="text-xs text-gray-500 mt-0.5">La lámina debe estar teñida bajo el protocolo estandarizado de Hematoxilina (Fondo Azul/Celeste). El escaneo digital debe realizarse a una resolución óptica mínima de 20x en formato JPG o PNG.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#00539C] font-bold text-xs flex items-center justify-center">2</span>
                                <div>
                                    <p className="font-bold text-gray-700">Procesamiento de Inferencia:</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Cargue el archivo en la zona de ingreso mediante arrastre directo o exploración local. Haga clic en &#34;Iniciar Diagnóstico Virtual&#34;. El sistema ejecutará las redes convolucionales de manera paralela en el clúster de la nube.</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#00539C] font-bold text-xs flex items-center justify-center">3</span>
                                <div>
                                    <p className="font-bold text-gray-700">Evaluación Comparativa:</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Utilice las pestañas del visor principal para alternar entre la salida avanzada de la U-Net PRO y el baseline Pix2Pix, evaluando los límites celulares en base al contraste morfológico inferior.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-3">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest border-b pb-2">
                            Fundamento de Datos: Justificación DeepLIIF
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            A diferencia de conjuntos de datos basados en cortes anatómicos consecutivos (como el dataset BCI), donde la desalineación micrométrica del bisturí introduce distorsiones geométricas imposibles de modelar mediante funciones de pérdida supervisada, este sistema se entrenó con la metodología multiplexada de DeepLIIF.
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Esta técnica garantiza una alineación perfecta a nivel de píxel entre el contraste citoplasmático base y la expresión real de la proteína Pan-CK. Gracias a esta consistencia matemática, el optimizador de la red neuronal converge eficazmente, eliminando las alucinaciones hiper-realistas comunes en arquitecturas no supervisadas (CycleGANs).
                        </p>
                    </div>
                </div>

                {/* COLUMNA DERECHA: GLOSARIO CLÍNICO DE MÉTRICAS */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between h-full">
                        <div>
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 border-b pb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-[#00539C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Glosario de Métricas de Calidad
                            </h3>

                            <dl className="space-y-4 text-xs">
                                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                    <dt className="font-bold text-[#00539C] uppercase tracking-wide">Coeficiente Dice (F1-Score)</dt>
                                    <dd className="text-gray-500 mt-1 leading-relaxed">Mide la superposición espacial y matemática entre la tinción predicha por la IA y el tejido real del laboratorio. Un valor de 0.80 indica una alta concordancia en los contornos celulares.</dd>
                                </div>

                                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                    <dt className="font-bold text-gray-700 uppercase tracking-wide">Error Cuadrático Medio (MSE)</dt>
                                    <dd className="text-gray-500 mt-1 leading-relaxed">Cuantifica la diferencia cuadrática promedio entre los valores de los píxeles de la imagen sintetizada y la real. Valores cercanos a cero ratifican la estabilidad del color.</dd>
                                </div>

                                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                    <dt className="font-bold text-gray-700 uppercase tracking-wide">Sensibilidad Diagnóstica</dt>
                                    <dd className="text-gray-500 mt-1 leading-relaxed">Capacidad del algoritmo para detectar de manera certera las regiones epiteliales positivas para el anticuerpo Pan-CK, mitigando la existencia de falsos negativos críticos.</dd>
                                </div>

                                <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                    <dt className="font-bold text-gray-700 uppercase tracking-wide">Especificidad Diagnóstica</dt>
                                    <dd className="text-gray-500 mt-1 leading-relaxed">Capacidad del modelo para identificar correctamente las regiones libres de tumor (estroma o tejido conectivo), evitando falsas coloraciones marrones.</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}