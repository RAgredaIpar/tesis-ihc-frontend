'use client';

/**
 * Pestaña de documentacion tecnica, protocolo de operacion y glosario clinico-estadistico.
 */
export default function DocsTab() {
    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-slide">
            <header className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-[#00539C] uppercase tracking-wide">
                    Documentación Técnica y Manual de Operación
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Sustento científico, guía de usuario y glosario normativo para el sistema de cuantificación digital histopatológica en el Servicio de Anatomía Patológica.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#00539C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                            Protocolo de Operación Estándar
                        </h3>

                        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                            <div className="flex gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#00539C] font-bold text-xs flex items-center justify-center">
                                    1
                                </span>
                                <div>
                                    <p className="font-bold text-gray-700">Preparación de la Muestra Digital:</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        La lámina histológica debe corresponder a un corte estándar inmunotintado para Ki-67 (DAB marrón) con contratinción de Hematoxilina (azul/morado) o bien a tinción H&amp;E para el modo hospitalario. El escaneo o captura microscópica debe realizarse a una magnificación óptica mínima de 20x en formato PNG, JPG o TIF.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#00539C] font-bold text-xs flex items-center justify-center">
                                    2
                                </span>
                                <div>
                                    <p className="font-bold text-gray-700">Procesamiento e Inferencia:</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Cargue el archivo en la zona de ingreso mediante arrastre o selección local. Seleccione la modalidad de análisis (IHC Nativo o H&amp;E Hospitalario) y active o desactive la separación watershed según la agregación celular. Al pulsar &ldquo;Ejecutar Cuantificación Ki-67&rdquo;, el backend procesará el tejido mediante el mosaico por ventana deslizante.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <span className="shrink-0 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#00539C] font-bold text-xs flex items-center justify-center">
                                    3
                                </span>
                                <div>
                                    <p className="font-bold text-gray-700">Evaluación Multicanal y Auditoría:</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Utilice las pestañas del visor para alternar entre la imagen base, la auditoría morfológica de contornos celulares y la segmentación multiclase a color (rojo: Ki-67+, azul: basal/negativo, verde: bordes).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-3">
                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest border-b pb-2">
                            Fundamento de Datos: Justificación DeepLIIF y Ki-67
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            A diferencia de colecciones de datos basadas en cortes anatómicos consecutivos seriados (donde la desalineación micrométrica introduce distorsiones geométricas espurias), este modelo se entrena sobre la metodología multiplexada de DeepLIIF (BC-DeepLIIF).
                        </p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Esta metodología garantiza el registro co-localizado a nivel de píxel entre la tinción cromógena DAB del antígeno de proliferación nuclear Ki-67 y los canales fluorescentes mpIF (DAPI, Lap2). Dicha correspondencia molecular permite que la red U-Net aprenda fronteras celulares fidedignas y discrimine núcleos proliferativos de células basales y estroma sin alucinaciones morfológicas.
                        </p>
                    </div>
                </div>

                {/* Columna Derecha: Glosario Clinico */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between h-full">
                        <div>
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-4 border-b pb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-[#00539C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                </svg>
                                Glosario de Métricas Diagnósticas
                            </h3>

                            <dl className="space-y-4 text-xs">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <dt className="font-bold text-[#00539C] uppercase tracking-wide">
                                        Índice de Proliferación Ki-67
                                    </dt>
                                    <dd className="text-gray-500 mt-1 leading-relaxed">
                                        Porcentaje de núcleos celulares epiteliales que expresan el antígeno Ki-67 (inmunorreactividad DAB marrón) respecto al total de células detectadas. Criterio estándar para estadificación y pronóstico en patología oncológica.
                                    </dd>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <dt className="font-bold text-[#00539C] uppercase tracking-wide">
                                        Coeficiente Dice (F1-Score)
                                    </dt>
                                    <dd className="text-gray-500 mt-1 leading-relaxed">
                                        Mide el grado de superposición espacial entre la máscara de segmentación inferida por la red y la verdad de terreno clínica (Ground Truth).
                                    </dd>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <dt className="font-bold text-gray-700 uppercase tracking-wide">
                                        Índice SSIM (Similitud Estructural)
                                    </dt>
                                    <dd className="text-gray-500 mt-1 leading-relaxed">
                                        Evalúa la conservación de luminancia, contraste y coherencia estructural en los tejidos procesados, cuantificando la nitidez del contorno nuclear.
                                    </dd>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <dt className="font-bold text-gray-700 uppercase tracking-wide">
                                        Especificidad Diagnóstica
                                    </dt>
                                    <dd className="text-gray-500 mt-1 leading-relaxed">
                                        Capacidad del modelo para clasificar apropiadamente las regiones de estroma y núcleos no proliferativos (negativos), previniendo falsas alarmas diagnósticas.
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}