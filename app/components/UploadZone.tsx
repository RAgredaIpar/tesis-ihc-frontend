import {ChangeEvent, DragEvent, useState} from 'react';

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
    loading: boolean;
}

export default function UploadZone({onFileSelect, loading}: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [showCheck, setShowCheck] = useState<boolean>(false);
    const [hasFile, setHasFile] = useState<boolean>(false);

    const processFile = (file: File) => {
        setHasFile(true);
        setShowCheck(true);
        onFileSelect(file);

        setTimeout(() => {
            setShowCheck(false);
        }, 2000);
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
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    return (
        <div className="w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                Ingreso de Muestra Digital
            </label>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                    isDragging ? 'border-[#00AEEF] bg-blue-50 scale-[1.02]' :
                        hasFile && !showCheck ? 'border-[#00539C] bg-[#F4F9FD]' :
                            'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={loading}
                />

                {showCheck ? (
                        <div className="flex flex-col items-center justify-center">
                            <svg className="h-16 w-16 mb-2" viewBox="0 0 52 52">
                                <circle className="stroke-green-500 fill-none" strokeWidth="4" strokeDasharray="160"
                                        strokeDashoffset="160" cx="26" cy="26" r="24"
                                        style={{animation: "drawCircle 0.6s ease-out forwards"}}/>
                                <path className="stroke-green-500 fill-none" strokeWidth="4" strokeDasharray="50"
                                      strokeDashoffset="50" d="M14.1 27.2l7.1 7.2 16.7-16.8"
                                      style={{animation: "drawCheck 0.4s ease-out 0.6s forwards"}}/>
                            </svg>
                            <p className="text-sm font-bold text-green-600">Lámina cargada</p>
                            <style>{`@keyframes drawCircle { to { stroke-dashoffset: 0; } }
                            @keyframes drawCheck { to { stroke-dashoffset: 0; } }
                            `}</style>
                        </div>
                    )

                    : hasFile ? (
                            <div className="flex flex-col items-center justify-center">
                                <svg className="h-10 w-10 text-[#00539C] mb-3 opacity-80" fill="none" viewBox="0 0 24 24"
                                     stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                                </svg>
                                <p className="text-sm text-[#00539C] font-bold">Muestra en memoria lista para análisis</p>
                                <p className="text-xs text-gray-400 mt-2">Haz clic o arrastra para reemplazar la imagen</p>
                            </div>
                        )

                        : (
                            <div className="flex flex-col items-center justify-center">
                                <svg
                                    className={`h-10 w-10 mb-4 transition-colors ${isDragging ? 'text-[#00AEEF]' : 'text-gray-400'}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                </svg>
                                <p className="text-sm text-gray-600 font-medium">
                                    {isDragging ? 'Suelte la imagen aquí' : 'Arrastre la lámina o haga clic para explorar'}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">Formatos soportados: JPG, PNG</p>
                            </div>
                        )}
            </div>

            {loading && (
                <div className="mt-4">
                    <div className="flex justify-between text-xs font-bold text-[#00539C] mb-1 uppercase">
                        <span>Analizando con Red Neuronal...</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#00AEEF] h-1.5 rounded-full animate-pulse w-full"></div>
                    </div>
                </div>
            )}
        </div>
    );
}